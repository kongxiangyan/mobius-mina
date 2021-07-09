import {
  isObject,
  Data,
  replayWithLatest
} from '../libs/mobius-utils.js'

(() => {
  // @refer: https://developers.weixin.qq.com/miniprogram/dev/reference/api/getApp.html
  // 在 App 注册之前就定义好 globalData 和 setGlobalData
  // 当 App 注册的时候，预先定义的 globalData 和 setGlobalData 会被合并到 App Instance 中
  // ! 务必在 App(appOptions) 之前执行
  const app = getApp({ allowDefault: true })
  app.globalData = {}
  app.setGlobalData = data => {
    const app = getApp({ allowDefault: true })
    const globalData = app.globalData
    if (isObject(data) && isObject(globalData)) {
      app.globalData = { ...globalData, ...data }
    } else {
      app.globalData = data
    }
  }
})()

export const wxRD = replayWithLatest(1, Data.of(wx))
// App 正式注册的时候会更新 appRD 的值（App Instance）
// 在 App 正式注册之前，appRD 的值是 App 默认实现
// 约定使用 app.setGlobalData 来添加数据
export const appRD = replayWithLatest(1, Data.of(getApp({ allowDefault: true })))

export const enterOptionsRD = replayWithLatest(1, Data.of(wx.getEnterOptionsSync()))
