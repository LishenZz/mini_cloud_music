// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

const db = cloud.database()

const playlistCollection = db.collection('playlist')

const MAX_LIMIT = 100
//第三方库
const rp = require('request-promise')

//BaseUrl
const URL = 'http://musicapi.xiecheng.live/personalized'

// 云函数入口函数
exports.main = async (event, context) => {
  //统计匹配查询条件的记录的条数
  const countResult = await playlistCollection.count()

  const total = countResult.total
  //Math.ceil()  “向上取整”

  const batchTimes = Math.ceil(total / MAX_LIMIT)
  
  const tasks = []

  //skip()指定查询返回结果时从指定序列后的结果开始返回，常用于分页
  //例如105条数据，skip(100)则从100开始 >到第105 条返回这5条数据
  //limit 在小程序端默认及最大上限为 20，在云函数端默认及最大上限为 1000
  for (let i = 0; i < batchTimes; i++) {
    let promise = playlistCollection.skip(i * MAX_LIMIT).limit(MAX_LIMIT).get()
    tasks.push(promise)
  }

  //从数据库中获取的音乐列表
  let list = {
    data: []
  }

  if (tasks.length > 0) {
    list = (await Promise.all(tasks)).reduce((acc, cur) => {
      return {
        data: acc.data.concat(cur.data)
      }
    })
  }

  const playlist = await rp(URL).then((res) => {
    return JSON.parse(res).result
  })

  //从url请求下来的音乐列表
  const newData = []
  for (let i = 0, len1 = playlist.length; i < len1; i++) {
    let flag = true
    for (let j = 0, len2 = list.data.length; j < len2; j++) {
      if (playlist[i].id === list.data[j].id) {
        flag = false
        break
      }
    }
    if (flag) {
      newData.push(playlist[i])
    }
  }

  for (let i = 0, len = newData.length; i < len; i++) {
    await playlistCollection.add({
      data: {
        ...newData[i],
        createTime: db.serverDate(),
      }
    }).then((res) => {
      console.log('插入成功')
    }).catch((err) => {
      console.error('插入失败')
    })
  }

  return newData.length

}