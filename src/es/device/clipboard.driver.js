import {
  Data,
  replayWithLatest,
  useGeneralDriver
} from '../../libs/mobius-utils.js'

export const clipboardDriver = options => {
  const { autoGet = false } = options

  const getClipboardD = Data.empty()
  const setClipboardRD = replayWithLatest(1, Data.empty())
  const clipboardRD = replayWithLatest(1, Data.empty())

  const triggerGetClipboard = () => {
    getClipboardD.triggerValue({})
  }
  getClipboardD.subscribeValue(() => {
    // @refer: https://developers.weixin.qq.com/miniprogram/dev/api/device/clipboard/wx.getClipboardData.html
    wx.getClipboardData({
      success (res) {
        clipboardRD.mutate(() => res.data)
      }
    })
  })
  setClipboardRD.subscribeValue(({ data }) => {
    // @refer: https://developers.weixin.qq.com/miniprogram/dev/api/device/clipboard/wx.setClipboardData.html
    wx.setClipboardData({
      data: data,
      complete: (res) => {
        // 无论剪贴板设置成功与否都执行
        triggerGetClipboard()
      }
    })
  })

  if (autoGet) {
    triggerGetClipboard()
  }

  return {
    inputs: {
      getClipboard: getClipboardD,
      setClipboard: setClipboardRD
    },
    outputs: {
      clipboard: clipboardRD
    }
  }
}

export const useClipboardDriver = useGeneralDriver(clipboardDriver)
