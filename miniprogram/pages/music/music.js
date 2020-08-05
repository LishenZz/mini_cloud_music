// pages/playlist/playlist.js
const MAX_LIMIT = 15
const db = wx.cloud.database()
Page({

  /**
   * 页面的初始数据
   */
  data: {
      swiperList:[],
      playlist: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
      this._getPlaylist()
      this._getSwiper()
  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    console.log('haha')
      this.setData({
            playlist: []
          })
          this._getPlaylist()
          this._getSwiper()
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    this._getPlaylist()
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  _getPlaylist() {
      wx.showLoading({
        title: '加载中',
      })
      wx.cloud.callFunction({
        name: 'music',
        data: {
          start: this.data.playlist.length,
          count: MAX_LIMIT,
          $url: 'playlist',
        }
      }).then((res) => {
        this.setData({
          playlist: this.data.playlist.concat(res.result.data)
        })
        wx.stopPullDownRefresh()
        wx.hideLoading()
      })
  },
  _getSwiper(){
    db.collection('swiper').get().then(res=>{
      this.setData({
        swiperList: res.data
      })
    })
  }

})