// pages/blog/blog.js
// 搜索的关键字
import formatTime from '../../utils/formatTime.js'

let keyword = ''
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 控制底部弹出层是否显示
    modalShow: false,
    blogList: [],
    commentList:[],
    blog_id:''
  },
  // 发布功能
  onPublish() {
    // 判断用户是否授权
    wx.getSetting({
      success: (res) => {
        console.log(res)
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: (res) => {
              // console.log(res)
              this.onLoginSuccess({
                detail: res.userInfo
              })
            }
          })
        } else {
          this.setData({
            modalShow: true,
          })
        }
      }
    })
  },
  onLoginSuccess(event) {
    console.log(event)
    const detail = event.detail
    wx.navigateTo({
      url: `../blog-edit/blog-edit?nickName=${detail.nickName}&avatarUrl=${detail.avatarUrl}`,
    })
  },
  onLoginFail() {
    wx.showModal({
      title: '授权用户才能发布',
      content: '',
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this._loadBlogList()

    // 小程序端调用云数据库
    /*  const db = wx.cloud.database()
     db.collection('blog').orderBy('createTime', 'desc').get().then((res)=>{
       console.log(res)
       const data = res.data
       for (let i = 0, len = data.length; i<len; i++){
         data[i].createTime = data[i].createTime.toString()
       }
       this.setData({
         blogList: data
       })
     }) */
  },

  onSearch(event) {
    this.setData({
      blogList: []
    })
    keyword = event.detail.keyword
    this._loadBlogList(0)
  },

  _loadBlogList(start = 0) {
    wx.showLoading({
      title: '拼命加载中',
    })
    
  
    wx.cloud.callFunction({
      name: 'blog',
      data: {
        keyword,
        start,
        count: 10,
        $url: 'list',
      }
    }).then((res) => {
      res.result.forEach(item => {
        wx.cloud.callFunction({
          name: 'blog',
          data: {
            blogId: item._id,
            $url: 'detail',
          }
        }).then((res) => {
          let _blog = res.result
          let commentList = res.result.commentList.data
          for (let i = 0, len = commentList.length; i < len; i++) {
            commentList[i].createTime = formatTime(new Date(commentList[i].createTime))
          }
          _blog.commentList.data = commentList

          this.setData({
            blogList:this.data.blogList.concat(_blog)
          })
        })
      });


      
      // this.setData({
      //   blogList: this.data.blogList.concat(res.result),
        
      // })
      wx.hideLoading()
      wx.stopPullDownRefresh()
    })
  },

  goComment(event) {
    wx.navigateTo({
      url: '../../pages/blog-comment/blog-comment?blogId=' + event.target.dataset.blogid,
    })
  },

  refreshCommentList(event){
    const content = event.detail.content
    
  },
  
  onShowBlogComment(){
    
  },



  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    this.setData({
      blogList: []
    })
    this._loadBlogList(0)
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {
    this._loadBlogList(this.data.blogList.length)
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function(event) {
    console.log(event)
    let blogObj = event.target.dataset.blog
    return {
      title: blogObj.content,
      path: `/pages/blog-comment/blog-comment?blogId=${blogObj._id}`,
      // imageUrl: ''
    }
  }
})