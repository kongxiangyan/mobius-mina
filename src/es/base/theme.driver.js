import {
  Data,
  replayWithLatest,
  useGeneralDriver
} from '../../libs/mobius-utils.js'

export const themeDriver = (options = {}) => {
  const defaultTheme = options.defaultTheme || 'light'
  // initial current theme state when first called
  // @refer: https://developers.weixin.qq.com/miniprogram/dev/api/base/system/system-info/wx.getSystemInfoSync.html
  const initialTheme = wx.getSystemInfoSync().theme

  if (initialTheme === undefined) {
    console.warn('[MobiusMINA] theme: 全局配置 `"darkmode":true` 时才能获取主题。')
  }

  const themeRD = replayWithLatest(1, Data.of(initialTheme || defaultTheme))

  // update theme state when theme change happen
  wx.onThemeChange(({ theme }) => {
    console.log('[MobiusMINA] theme: ', theme)
    themeRD.triggerValue(theme)
  })

  return {
    inputs: {},
    outputs: {
      theme: themeRD
    }
  }
}

export const useThemeDriver = useGeneralDriver(themeDriver)
