import {
  useGeneralDriver
} from '../../libs/mobius-utils.js'

// TODO: 支持自定义提示信息
// TODO: 支持更加完善的自动提示，根据 SDK 版本推断微信版本，比如：您的微信版本过低，请升级至 8.0.0 以上版本。

// @refer: https://developers.weixin.qq.com/miniprogram/dev/framework/compatibility.html
const compareVersion = (v1, v2) => {
  v1 = v1.split('.')
  v2 = v2.split('.')
  const len = Math.max(v1.length, v2.length)

  while (v1.length < len) {
    v1.push('0')
  }
  while (v2.length < len) {
    v2.push('0')
  }

  for (let i = 0; i < len; i++) {
    const num1 = parseInt(v1[i])
    const num2 = parseInt(v2[i])

    if (num1 > num2) {
      return 1
    } else if (num1 < num2) {
      return -1
    }
  }

  return 0
}
const toast = content => {
  wx.showToast({
    title: content,
    icon: 'none',
    duration: 2000,
    mask: false
  })
}

export const updateDriver = options => {
  // iOS 6.5.8 / Android 6.5.7 是后台设置最低基础库版本的阈值
  // @refer: https://developers.weixin.qq.com/miniprogram/dev/framework/compatibility.html
  const {
    enableWeChatUpdate = false,
    enableMINAUpdate = false,
    minWeChatVersion = { iOS: '6.5.8', Android: '6.5.7', others: '6.5.7' },
    minSDKVersion = { iOS: '2.0.0', Android: '2.0.0', others: '2.0.0' }
  } = options

  // @refer: https://developers.weixin.qq.com/miniprogram/dev/api/base/system/wx.getSystemInfoSync.html
  const systemInfo = wx.getSystemInfoSync()
  const { SDKVersion, system, version } = systemInfo
  const systemName = system.split(' ')[0] || 'others' // "iOS 10.0.1" -> "iOS"

  if (enableWeChatUpdate) {
    // @refer: https://developers.weixin.qq.com/miniprogram/dev/api/base/update/wx.updateWeChatApp.html
    // 小程序基础库 2.12.0 开始支持
    const isWeChatOutdated = compareVersion(version, minWeChatVersion[systemName]) < 0
    const isSDKOutdated = compareVersion(SDKVersion, minSDKVersion[systemName]) < 0
    if (isWeChatOutdated || isSDKOutdated) {
      if (wx.canIUse('updateWeChatApp')) {
        wx.showModal({
          title: '微信版本较低',
          content: '系统检测到您微信版本较低，可能有部分功能无法使用，是否前往升级？',
          showCancel: true,
          success: ({ confirm, cancel }) => {
            if (confirm) {
              wx.updateWeChatApp()
            }
            if (cancel) {
              toast('为避免影响您正常使用，请挑选合适的时间进行手动升级。')
            }
          }
        })
      } else {
        toast('系统检测到您微信版本较低，可能有部分功能无法使用，请手动升级！')
      }
    }
  }

  if (enableMINAUpdate) {
    // @refer: https://developers.weixin.qq.com/miniprogram/dev/api/base/update/wx.getUpdateManager.html
    const updateManager = wx.getUpdateManager()
    updateManager.onCheckForUpdate(({ hasUpdate }) => {
      console.log('[Update] MINA hasUpdate', hasUpdate)
    })
    updateManager.onUpdateReady(() => {
      wx.showModal({
        title: '新版本已就绪',
        content: '小程序新版本已经准备好，是否重启应用进行更新？',
        success: ({ confirm, cancel }) => {
          if (confirm) {
            updateManager.applyUpdate()
          }
          if (cancel) {
            toast('您先忙，下次打开小程序时就是准备好的新版本啦。')
          }
        }
      })
    })
    updateManager.onUpdateFailed(() => {
      toast('新版本下载失败，请检查您的网络，在您下次打开小程序时会重新尝试更新。')
    })
  }

  return {
    inputs: {},
    outputs: {}
  }
}

export const useUpdateDriver = useGeneralDriver(updateDriver)
