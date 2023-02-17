var express = require('express');
var router = express.Router();
const connection = require('.././db/db')
const path = require('path');
const { resolve } = path;
const md5 = require('md5')
const multiparty = require('multiparty');
const uploadPath = resolve(path.join(process.cwd(), 'upload'));
const fs = require('fs');
const {existsSync,statSync,readdirSync,rmdirSync,unlinkSync} = fs;
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

//查询数据
router.post("/findid", (req, res) => {
  let id = req.body.id;
  const sqlStr = "SELECT * FROM blog WHERE id = '" + id + "' ";
  connection.query(sqlStr, (error, results, fields) => {
    if (error) {
      console.log(error);
    } else {
      results = JSON.parse(JSON.stringify(results));
      results[0].content = new Buffer(results[0].content.data).toString()
      res.json({ code: 0, data: results });

    }
  });
})


//注册
router.post('/reqregister', (req, res) => {
  let username = req.body.username;
  let password = md5(req.body.password);
  let status = req.body.status;
  // console.log(username,password);
  const sqlStr = "SELECT * FROM user WHERE username = '" + username + "'";
  connection.query(sqlStr, (error, results, fields) => {
    if (results[0]) {//用户已经存在
      res.json({ code: 50026, message: "用户名已经存在" })
    } else {
      const addSql = "INSERT INTO user (username, password,status) VALUES (?, ?,?)";
      const addSqlParams = [username, password, status];
      connection.query(addSql, addSqlParams, (error, results, fields) => {
        if (error) {
          res.json({ code: 50027, message: "注册失败" })
        } else {
          res.json({ code: 0, message: "注册成功" })
        }
      })
    }
  })
})
//登录
router.get('/reqlogin', (req, res) => {
  let username = req.query.username;
  let password = md5(req.query.password);

  const sqlStr = "SELECT * FROM user WHERE username = '" + username + "'";
  connection.query(sqlStr, (error, results, fields) => {
    results = JSON.parse(JSON.stringify(results));
 
    results = JSON.parse(JSON.stringify(results));
    if (results[0]) {
      if (results[0].password !== password) {
        res.json({ code: 50026, data:{},message: '密码不正确!' });
      } else {
        res.json({ code: 0, data: results, message: "登录成功" })
      }
    } else {
      res.json({ code: 50026, data:{},message: '用户名不正确!' });
    }

  })
})


//文章发布
router.post('/release', (req, res) => {
  const {title,content,label,mold,currentime,author,image} = req.body;

  const sqlStr = "INSERT INTO blog(content,title,mold,label,currentime,author,image) VALUES (?,?,?,?,?,?,?)";
  const addSqlParams = [content, title, mold, label, currentime, author, image];
  connection.query(sqlStr, addSqlParams, (error, results, fields) => {
    if (error) {
      res.json({ code: 50026, message: "发布文章失败" });
    } else {
      console.log(results);
      res.json({ code: 0, message: "发布文章成功" });
    }
  })

})


//获取所有文章信息

router.get('/getallcontent', (req, res) => {
  const { pageNum, pageSize } = req.query
  const array = [];
  const sqlStr = 'SELECT * FROM blog ';
  connection.query(sqlStr, (error, results, fields) => {
    if (error) {
      console.log(error);
    } else {

      results = JSON.parse(JSON.stringify(results));
      for (var i = 0; i < results.length; i++) {
        array.push(new Buffer(results[i].content.data).toString());
        results[i].content = new Buffer(results[i].content.data).toString()
      }

      res.json({ code: 0, data: pageFilter(results, pageNum, pageSize) });

    }
  })
})
//获取热门文章
router.get('/getHotArticle', (req, res) => {
  const { limitcount } = req.query
  const sqlStr = `SELECT * FROM blog order by readcount desc limit ${limitcount}`;
  connection.query(sqlStr, (error, results, fields) => {
    if (error) {
      console.log(error);
    } else {

      results = JSON.parse(JSON.stringify(results));
      results = results.sort((a, b) => a.readconut- b.readconut)
      res.json({ code: 0, data: results });

    }
  })
})

//获取个人文章信息
router.get('/getowncontent', (req, res) => {
  const { author, pageNum, pageSize } = req.query;
 

  const sqlStr = "SELECT * FROM blog WHERE author = '" + author + "' ";
  connection.query(sqlStr, (error, results, fields) => {
    if (error) {
      console.log(error);
    } else {

      results = JSON.parse(JSON.stringify(results));
      for (var i = 0; i < results.length; i++) {
      
        results[i].content = new Buffer(results[i].content.data).toString()
      }
      res.json({ code: 0, data: pageFilter(results, pageNum, pageSize) });

    }
  })
})

//修改个人资料
router.post('/modifyingdata', (req, res) => {
  const { username, birthday, location, information, realname, job, sex } = req.body;


  const sqlStr = "UPDATE user SET birthday = '" + birthday + "', location = '" + location + "',information = '" + information + "', realname = '" + realname + "',job = '" + job + "',sex = '" + sex + "' WHERE username = '" + username + "' ";
  const otherSqlStr = "SELECT * FROM user WHERE username = '" + username + "'";
  connection.query(sqlStr, (error, results, fields) => {
    results = JSON.parse(JSON.stringify(results));
    if (error) {
      res.json({ success_code: 0, message: "修改资料失败" });
    } else {
      connection.query(otherSqlStr, (err, result, field) => {
        if (err) {
          res.json({ code: 50026, message: "修改资料失败" });
        } else {
          console.log(result);
          res.json({ code: 0, message: "修改成功", data: result });
        }
      })

    }
  })
})
//修改个人资料
router.post('/modifyingdataV2', (req, res) => {
  const {id, username, birthday, location, information, realname, job, sex,image,filePath } = req.body;

  const sqlStr = "UPDATE user SET image = '" + image + "',birthday = '" + birthday + "', location = '" + location + "',information = '" + information + "', realname = '" + realname + "',job = '" + job + "',sex = '" + sex + "' WHERE username = '" + username + "' ";
  const otherSqlStr = "SELECT * FROM user WHERE id = '" + id + "'";
  connection.query(sqlStr, (error, results, fields) => {
    results = JSON.parse(JSON.stringify(results));
    if (error) {
      res.json({ code: 50026, message: "修改资料失败" });
    } else {
      connection.query(otherSqlStr, (err, result, field) => {
        if (err) {
          res.json({ code: 50026, message: "修改资料失败" });
        } else {
          // const deleteRes = delPath(`${uploadPath}/${filePath}`);
          // if(deleteRes===this.trace){
          //   res.json({ code: 0, message: "修改成功", data: result });
          // }
          res.json({ code: 0, message: "修改成功", data: result });
        }
      })

    }
  })
})
//获取个人信息；
router.post('/getinfo', (req, res) => {
  const {username} = req.body;
 
  const sqlStr = "SELECT * FROM user WHERE username = '" + username + "' ";
  connection.query(sqlStr, (error, results, fields) => {
    if (error) {
      res.json({ err_code: 0, message: "获取数据失败" })
    } else {
      res.json({ success_code: 200, message: results })
    }
  })
})
router.post('/getinfobyid', (req, res) => {
  const {id} = req.body;
  const sqlStr = `SELECT * FROM user WHERE id = ${id}`
  connection.query(sqlStr, (error, results, fields) => {
    if (error) {
      res.json({ code: 50026, message: "获取数据失败",data:[] })
    } else {
      const {birthday,id,image,information,job,location,realname,sex,status,username} = results[0];
      const userInfo = [{
        birthday,id,image,information,job,location,realname,sex,status,username
      }]
      res.json({ code: 0, message: '获取数据成功',data:userInfo })
    }
  })
})
//密码匹配
router.post('/matchingPwd',(req,res)=>{
  const {id,password} = req.body;
  const sqlStr = `SELECT * FROM user WHERE id = ${id}`
  connection.query(sqlStr, (error, results, fields) => {
    if (error) {
      res.json({ code: 50026, message: "密码匹配失败" })
    } else {
      if(md5(password) === results[0].password){
        res.json({ code: 0, message: '密码匹配成功' })
      }else{
        res.json({ code: 50026, message: "密码匹配失败" })
      }
    }
  })
})
//图片上传

router.post('/submitImage', (req, res) => {
  const { image, username } = req.body;
  const sqlStr = "UPDATE user SET image = '" + image + "' WHERE username = '" + username + "' ";
  const userSqlStr = "SELECT * FROM user WHERE username = '" + username + "' ";

  connection.query(sqlStr, (err, result, fields) => {
    if (err) {
      res.json({ status: 400, message: '修改头像失败' })
    } else {
      connection.query(userSqlStr, (error, results, field) => {
        if (!error) {
          res.json({ status: 200, data: results })

        }
      })
    }
  })
})

router.post('/blogUserImage', (req, res) => {
  const { image, username } = req.body;

  const sqlStr = "UPDATE blog SET image = '" + image + "' WHERE author = '" + username + "' ";
  connection.query(sqlStr, (err, result, fields) => {
    if (!err) {
      res.json({ status: 200})
    }else{
      res.json({ status: 400})
    }
  })
})

//获取图片
router.post('/getimage', (req, res) => {
  const username = req.body.username;

  const sqlStr = "SELECT * FROM user WHERE username = '" + username + "'";
  connection.query(sqlStr, (error, results, files) => {
    if (error) {
      console.log(error);
      res.json({ success_code: 0, message: '获取失败' })
    } else {
      results = JSON.parse(JSON.stringify(results[0]));
      res.json({ success_code: 200, message: results })
    }
  })
})


//删除文章
router.post('/delarticle', (req, res) => {
  const {id} = req.body;
  const sqlStr = "DELETE FROM blog WHERE id = '" + id + "'";
  connection.query(sqlStr, (error, results, fields) => {
    if (error) {
      res.json({ code: 50026, message: "删除失败" });
    } else {
      res.json({ code: 0, message: "删除文章成功" })
    }
  })
})
//编辑文章
router.post('/editarticle', (req, res) => {
  const { id, title, content, label, mold, currentime } = req.body;
  const sqlStr = "UPDATE blog SET title =  '" + title + "',content =  '" + content + "',label =  '" + label + "',mold =  '" + mold + "',currentime =  '" + currentime + "' WHERE id = '" + id + "' ";
  connection.query(sqlStr, (error, results, fields) => {
    if (error) {
      console.log(error)
      res.json({ code: 50026, message: "修改失败" });
    } else {
    
      res.json({ code: 0, message: "修改成功" })
    }
  })
})


//修改密码接口
router.post('/changepassword', (req, res) => {
  const id = req.body.id;
  const changepassword = md5(req.body.changepassword);

  const sqlStr = "UPDATE user SET password = '" + changepassword + "' WHERE id = '" + id + "' ";
  connection.query(sqlStr, (error, results, fields) => {
    if (error) {
      res.json({ code: 50026, message: "修改密码失败" });
    } else {
      
      res.json({ code: 0, message: "修改密码成功,请重新登录" });
    }
  })
})

//阅读数
router.get('/readconut', (req, res) => {
  const { readconut, id } = req.query
  // let readconut = req.body.count;
  // let id = req.body.id;
  const sqlStr = `UPDATE blog SET readcount = ${readconut} WHERE id = ${id}`;
  connection.query(sqlStr, (error, results, files) => {
    if (error) {
      res.json({ err_code: 0 });
    } else {
      res.json({ success_code: 200 });
    }
  })
})

//评论
router.post('/commit', (req, res) => {
  const { blogimg, bloguser, blogid, tousername, status, blogcomment, commentime } = req.body;

  const sqlStr = "INSERT INTO comment(blogimg,bloguser,blogid,tousername,status,blogcomment,commentime) VALUES (?,?,?,?,?,?,?)";
  const addSqlParams = [blogimg, bloguser, blogid, tousername, status, blogcomment, commentime];
  connection.query(sqlStr, addSqlParams, (error, results, fields) => {
    if (error) {
      res.json({ code: 50026, message: "发表评论失败" })
    } else {
      res.json({ code: 0, message: '发表评论成功' })
    }
  })
});

//获取相对于的评论
router.get('/getcommit', (req, res) => {
  const {blogid} = req.query;

  const sqlStr = `SELECT * FROM comment WHERE blogid = ${blogid}`;
  connection.query(sqlStr, (error, results, fields) => {
    if (error) {
      res.json({ code: 50026, message: "获取失败",data:[] });
    } else {
      res.json({ code: 0, message: "获取成功",data:results });

    }
  })
})


router.post('/getmycomment', (req, res) => {
  const {tousername} = req.body;
  const sqlStr = "SELECT * FROM comment WHERE tousername = '" + tousername + "' ";
  connection.query(sqlStr, (error, results, fields) => {
    if (error) {
      res.json({ err_code: 0, message: "获取失败" });
    } else {
      res.json({ success_code: 200, message: results });

    }
  })
});
//修改评论状态
router.post('/modifyStatus', (req, res) => {
  const {id,status} = req.body
  const sqlStr = "UPDATE comment SET status = '" + status + "' WHERE id = '" + id + "' ";
  connection.query(sqlStr, (error, results, fields) => {
    if (error) {
      res.json({ err_code: 0, message: "获取失败" });
    } else {
      res.json({ success_code: 200, message: results });

    }
  })
})

//获取用户卡片
router.post('/getUserCard', (req, res) => {
  const {bloguser} = req.body;
  const sqlStr = "SELECT * FROM user WHERE username = '" + bloguser + "' ";
  connection.query(sqlStr, (error, results, fields) => {
    if (error) {
      res.json({ err_code: 0, message: "获取失败" });
    } else {
      res.json({ success_code: 200, message: results });

    }
  })

})
//用户关注
router.post('/careUser', (req, res) => {
  const {bloguser,carebloguser,carebloguserimg,carebloguserstate,careblogusersex,carestatus} = req.body
  const sqlStr = "INSERT INTO careList(bloguser,carebloguser,carebloguserimg,carebloguserstate,careblogusersex,carestatus) VALUES (?,?,?,?,?,?)";
  const addSqlParams = [bloguser, carebloguser, carebloguserimg, carebloguserstate, careblogusersex, carestatus];
  connection.query(sqlStr, addSqlParams, (error, results, fields) => {

    if (error) {
      res.json({ err_code: 0, message: "关注失败" })
    } else {
      res.json({ success_code: 200, message: "关注成功", userinfo: results[0] })
    }
  })

})
//获取用户关注列表
router.post('/getUserList', (req, res) => {
  const {bloguser} = req.body;
  const sqlStr = "SELECT * FROM careList WHERE bloguser = '" + bloguser + "' ";
  connection.query(sqlStr, (error, results, fields) => {
    if (error) {
      res.json({ err_code: 0, message: "获取失败" });
    } else {
      res.json({ success_code: 200, message: results });

    }
  })

})
//取消关注的用户
router.post('/cancleCare', (req, res) => {
  const {carebloguser} = req.body;
  const sqlStr = "DELETE FROM careList WHERE carebloguser = '" + carebloguser + "'";
  connection.query(sqlStr, (error, results, files) => {
    if (error) {
      res.json({ err_code: 0, message: "获取失败" });
    } else {
      res.json({ success_code: 200, message: results });

    }
  })
})
//更新状态
router.post('/modifyuserstatus', (req, res) => {
  const {id,status} = req.body
  const sqlStr = "UPDATE user SET status = '" + status + "' WHERE id = '" + id + "' ";
  connection.query(sqlStr, (error, results, fields) => {
    if (error) {
      res.json({ err_code: 0, message: "获取失败" });
    } else {
      res.json({ success_code: 200, message: results });

    }
  })
})

//头像更改
// router.post('/updateAvatar',(req,res)=>{
//   console.log(req)
// })
/*
得到指定数组的分页信息对象
 */
function pageFilter(arr, pageNum, pageSize) {
  pageNum = pageNum * 1
  pageSize = pageSize * 1
  const total = arr.length
  const pages = Math.floor((total + pageSize - 1) / pageSize)
  const start = pageSize * (pageNum - 1)
  const end = start + pageSize <= total ? start + pageSize : total
  const list = []
  for (var i = start; i < end; i++) {
    list.push(arr[i])
  }
  // console.log(list)

  return {
    pageNum,
    total,
    pages,
    pageSize,
    list
  }
}
router.post('/deleteFile',(req,res)=>{
  const filePath = req.body.filePath;
  if(filePath){
    const deleteRes = delPath(`${uploadPath}/${filePath}`);
    if(deleteRes === true){
      res.json({
        code:0,
        message:'删除成功'
      })
    }else{
      res.json({
        code:50026,
        message:'删除失败'
      })
    }
  }
})
function delPath(path) {
  if (!existsSync(path)) {
    console.log("路径不存在");
    return "路径不存在";
  }
  const info = statSync(path);
  if (info.isDirectory()) {//目录
    const data = readdirSync(path);
    if (data.length > 0) {
      for (let i = 0; i < data.length; i++) {
        delPath(`${path}/${data[i]}`); //使用递归
        if (i == data.length - 1) { //删了目录里的内容就删掉这个目录
          delPath(`${path}`);
        }
      }
    } else {
      rmdirSync(path);//删除空目录
      return true
    }
  } else if (info.isFile()) {
    unlinkSync(path);//删除文件
    return true
  }
}
require('./file-upload')(router)
module.exports = router;

