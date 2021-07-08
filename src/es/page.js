import {
  isObject, isArray, isString, isFunction,
  Data,
  replayWithLatest,
  promiseWithLatestFromT,
  createGeneralDriver, useGeneralDriver
} from '../libs/mobius-utils.js'
import { useExitStateDriver } from './exitState.page.js'

// TODO: pageScroll 添加节流选项
// TODO: overwriteReserved 添加更加多样的控制选项，包括提示级别（info, warn, error）、更精确的字段规则（为单独的方法名定义规则）

const RESERVED_PAGE_METHOD_NAMES = [
  'load', 'show', 'ready', 'ready', 'hide', 'unload', 'tabItemTap',
  'pullDownRefresh', 'reachBottom', 'pageScroll', 'resize',
  'shareAppMessage', 'shareTimeline', 'addToFavorites',
  'onSaveExitState'
]

const deepCopyViaJSON = obj => JSON.parse(JSON.stringify(obj))

const makeMethodsItem = method => {
  if (isString(method)) {
    const _data = Data.empty()
    const _func = function (e) {
      _data.triggerValue(e)
    }
    return { name: method, func: _func, data: _data }
  } else if (isObject(method)) {
    const { name, func, data } = method
    if (!name) {
      throw (new TypeError('"name" is required when methods item is of type "Object".'))
    }
    if (!func && !data) {
      throw (new TypeError('One of "func" and "data" is required at least when methods is of type "Object".'))
    }
    if (func && !isFunction(func)) {
      throw (new TypeError(`"func" is expected to be type of "Function", but received "${typeof func}".`))
    }
    if (data && !data.isAtom) {
      throw (new TypeError('"data" is expected to be type of "Atom".'))
    }
    const res = { name }
    // 如果 func 和 data 都没有提供，则创建二者
    if (!func && !data) {
      const _data = Data.empty()
      const _func = function (e) {
        _data.triggerValue(e)
      }
      res.data = _data
      res.func = _func
    }
    // 如果提供了 data 但没有提供 func，则使用 data 创建 func
    if (!func && data) {
      const _func = function (e) {
        data.triggerValue(e)
      }
      res.data = data
      res.func = _func
    }
    // 如果提供了 func 但没有提供 data，则 data 为空
    if (func && !data) {
      res.func = func
    }
    return res
  } else {
    throw (new TypeError(`item of "methods" is expected to be type of "String" | "Object", but received "${typeof method}".`))
  }
}
const makeValidMethods = methods => {
  if (isObject(methods)) {
    const _methods = Object.entries(methods)
      .map(([name, item]) => isFunction(item) ? item() : isObject(item) ? ({ ...item, name }) : item)
      .map(makeMethodsItem)
    return _methods
  } else if (isArray(methods)) {
    const _methods = methods
      .map(item => isFunction(item) ? item() : item)
      .map(makeMethodsItem)
    return _methods
  } else {
    throw (new TypeError(`"methods" is expected to be type of "Array" | "Object", but received "${typeof methods}".`))
  }
}

export const pageDriver = createGeneralDriver({
  prepareSingletonLevelContexts: (options = {}, driverLevelContexts) => {
    // 当 isOverwriteReserved 设置为 true 的时候，methods 如果涉及到保留方法名，不会在控制台打印提示
    // 我们希望这些「非常规」操作在开发者编写的代码层面有所体现，而不是必需要靠推断才能够知晓
    const {
      name,
      data: defaultData = {}, methods = {},
      config: {
        isOverwriteReserved = false,
        enableShareAppMessage = false, enableShareTimeline = false, enableAddToFavorites = false,
        enablePageScroll = false,
        enableExitState = false
      } = {}
    } = options

    const pageRD = replayWithLatest(1, Data.empty())

    // page.data 和 app.globalData 的数据初始化逻辑不同
    // 原因在于 page 在注册的时候就需要一个初始的 data，而 app.globalData 并不需要
    const dataInD = Data.empty()
    const dataOutRD = replayWithLatest(1, Data.of(defaultData))
    const dataChangeRD = replayWithLatest(1, Data.of({ prev: null, cur: defaultData, change: defaultData }))
    const renderedDataRD = replayWithLatest(1, Data.of(defaultData))

    promiseWithLatestFromT(pageRD, dataInD).subscribeValue(([data, page]) => {
      const prevData = deepCopyViaJSON(page.data)
      // setData 在逻辑层的操作是同步，因此 this.data 中的相关数据会立即更新；
      // setData在视图层的操作是异步，因此页面渲染可能并不会立即发生。
      //  -> 回调函数 在 setData 引起的界面更新渲染完毕后执行
      page.setData({ ...data }, () => {
        renderedDataRD.triggerValue(deepCopyViaJSON(page.data))
      })
      const curData = deepCopyViaJSON(page.data)

      dataOutRD.triggerValue(curData)
      dataChangeRD.triggerValue({ prev: prevData, cur: curData, change: deepCopyViaJSON(data) })
    })

    // 分享和收藏
    const shareAppMessageInfoInD = Data.of({})
    const shareTimelineInfoInD = Data.of({})
    const addToFavoritesInfoInD = Data.of({})

    // 生命周期和内置方法
    const loadRD = replayWithLatest(1, Data.empty())
    const showRD = replayWithLatest(1, Data.empty())
    const readyRD = replayWithLatest(1, Data.empty())
    const hideRD = replayWithLatest(1, Data.empty())
    const unloadRD = replayWithLatest(1, Data.empty())
    const pullDownRefreshD = Data.empty()
    const reachBottomD = Data.empty()
    const shareAppMessageRD = replayWithLatest(1, Data.empty())
    const shareTimelineRD = replayWithLatest(1, Data.empty())
    const addToFavoritesD = Data.empty()
    const pageScrollRD = replayWithLatest(1, Data.empty())
    const resizeRD = replayWithLatest(1, Data.empty())
    const tabItemTapD = Data.empty()

    const validMethods = makeValidMethods(methods)
    const methodFuncs = validMethods.reduce((prev, { name, func }) => {
      prev[name] = prev[name] || func
      return prev
    }, {})
    const methodAtoms = validMethods.reduce((prev, { name, data }) => {
      if (data) {
        prev[name] = prev[name] || data
      }
      return prev
    }, {})

    // 检测保留的方法名，重名的时候进行提示
    const names = validMethods.map(item => item.name)
    const reservedNames = names.filter(name => RESERVED_PAGE_METHOD_NAMES.includes(name))
    if (reservedNames.length > 0 && !isOverwriteReserved) {
      console.warn(`[MobiusMINA] reserved names detected: ${JSON.stringify(reservedNames)}.`)
    }

    // 注意：
    //   1. onLoad 等方法不能使用匿名函数定义，会导致 this 指向 undefined
    //
    // @refer: https://developers.weixin.qq.com/miniprogram/dev/framework/app-service/page-life-cycle.html
    // @refer: https://developers.weixin.qq.com/miniprogram/dev/framework/app-service/route.html
    const pageOptions = {
      type: 'page',
      name: name,
      data: defaultData,
      options: {
        // @refer: https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/pure-data.html
        pureDataPattern: /^_/
      },
      onLoad: function (options) {
        pageRD.triggerValue(this)
        loadRD.triggerValue(options)
      },
      onShow: function () {
        showRD.triggerValue({})
      },
      onReady: function () {
        readyRD.triggerValue({})
      },
      onHide: function () {
        hideRD.triggerValue({})
      },
      onUnload: function () {
        unloadRD.triggerValue({})
        pageRD.triggerValue(null)
      },
      onPullDownRefresh: function () {
        pullDownRefreshD.trigger({})
      },
      onReachBottom: function () {
        reachBottomD.triggerValue({})
      },
      onResize: function (res) {
        resizeRD.triggerValue(res)
      },
      onTabItemTap: function (res) {
        tabItemTapD.triggerValue(res)
      },
      ...methodFuncs
    }
    if (enableShareAppMessage && !pageOptions.onShareAppMessage) {
      pageOptions.onShareAppMessage = function (res) {
        shareAppMessageRD.triggerValue(res)
        const shareInfo = shareAppMessageInfoInD.value
        return { ...shareInfo }
      }
    }
    if (enableShareTimeline && !pageOptions.onShareTimeline) {
      pageOptions.onShareTimeline = function (res) {
        shareTimelineRD.triggerValue(res)
        const shareInfo = shareTimelineInfoInD.value
        return { ...shareInfo }
      }
    }
    if (enableAddToFavorites && !pageOptions.onAddToFavorites) {
      pageOptions.onAddToFavorites = function (res) {
        addToFavoritesD.triggerValue(res)
        const addInfo = addToFavoritesInfoInD.value
        return { ...addInfo }
      }
    }
    if (enablePageScroll && !pageOptions.onPageScroll) {
      pageOptions.onPageScroll = function (res) {
        pageScrollRD.triggerValue(res)
      }
    }

    const exitStateDriver = useExitStateDriver({ enableExitState, pageOptions, autoEquip: true }, {})

    Page(pageOptions)

    return {
      inputs: {
        data: dataInD,
        shareAppMessageInfo: shareAppMessageInfoInD,
        shareTimelineInfo: shareTimelineInfoInD,
        addToFavorites: addToFavoritesInfoInD,
        ...exitStateDriver.inputs,
        ...methodAtoms
      },
      outputs: {
        page: pageRD,
        data: dataOutRD,
        renderedData: renderedDataRD,
        dataChange: dataChangeRD,
        load: loadRD,
        show: showRD,
        ready: readyRD,
        hide: hideRD,
        unload: unloadRD,
        pullDownRefresh: pullDownRefreshD,
        reachBottom: reachBottomD,

        resize: resizeRD,
        tabItemTap: tabItemTapD,

        ...exitStateDriver.outputs,
        ...methodAtoms
      }
    }
  }
})

export const usePageDriver = useGeneralDriver(pageDriver)
