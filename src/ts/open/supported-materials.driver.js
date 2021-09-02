import {
  isString, isArray, isObject,
  Data,
  replayWithLatest, binaryTweenPipeAtom,
  useGeneralDriver
} from '../libs/mobius-utils.js'

import { enterOptionsRD } from '../global.js'

const DEFAULT_TYPES = {
  video: { typeName: 'video', mimeType: 'video/*' },
  mp4: { typeName: 'mp4', mimeType: 'video/mp4' },
  audio: { typeName: 'audio', mimeType: 'audio/*' },
  image: { typeName: 'image', mimeType: 'image/*' },
  html: { typeName: 'html', mimeType: 'text/html' },
  txt: { typeName: 'txt', mimeType: 'text/plain' },
  general: { typeName: 'general', mimeType: 'application/*' },
  pdf: { typeName: 'pdf', mimeType: 'application/pdf' },
  doc: { typeName: 'doc', mimeType: 'application/msword' },
  docx: { typeName: 'docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  docm: { typeName: 'docm', mimeType: 'application/vnd.ms-word.document.macroEnabled.12' },
  xls: { typeName: 'xls', mimeType: 'application/vnd.ms-excel' },
  xlsx: { typeName: 'xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  xlsm: { typeName: 'xlsm', mimeType: 'application/vnd.ms-excel.sheet.macroEnabled.12' },
  ppt: { typeName: 'ppt', mimeType: 'application/vnd.ms-powerpoint' },
  pptx: { typeName: 'pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
  zip: { typeName: 'zip', mimeType: 'application/zip' },
  rar: { typeName: 'rar', mimeType: 'application/vnd.rar' },
  '7z': { typeName: '7z', mimeType: 'application/x-7z-compressed' },
  psd: { typeName: 'psd', mimeType: 'application/x-photoshop' },
  dwg: { typeName: 'dwg', mimeType: 'application/acad' },
  cdr: { typeName: 'cdr', mimeType: 'application/x-cdr' },
  dxf: { typeName: 'dxf', mimeType: 'application/dxf' },
  stp: { typeName: 'stp', mimeType: 'application/step' },
  rtf: { typeName: 'rtf', mimeType: 'application/rtf' },
  ai: { typeName: 'ai', mimeType: 'application/postscript' }
}

// format types to [{ typeName, mimeType }, ...]
const formatTypes = types => {
  if (!isString(types) && !isArray(types) && !isObject(types)) {
    throw (new TypeError(`"types" is expected to be type of "String" | "Array" | "Object", but received "${typeof types}".`))
  }

  if (isString(types)) {
    return [types].map(type => DEFAULT_TYPES[type])
  } else if (isArray(types)) {
    return types.map(type => {
      if (!isString(type) && !isObject(type)) {
        throw (new TypeError(`item of "types" is expected to be type of "String" | "Object", but received "${typeof type}".`))
      }
      if (isString(type)) {
        const _type = DEFAULT_TYPES[type]
        if (_type === undefined) {
          throw (new Error(`"${type}" is not found in DEFAULT_TYPES.`))
        }
        return _type
      }
      if (isObject(type)) {
        const { typeName, mimeType } = type
        if (typeName === undefined || mimeType === undefined) {
          throw (new TypeError('"typeName" & "mimeType" is required when item of "types" is of type "Object".'))
        }
        return type
      }
    })
  } else if (isObject(types)) {
    const { typeName, mimeType } = types
    if (typeName === undefined || mimeType === undefined) {
      throw (new TypeError('"typeName" & "mimeType" is required when item of "types" is of type "Object".'))
    }
    return [types]
  }
}

export const supportedMaterialsDriver = options => {
  const {
    useDefaultEnterOptions = true, types = ['html', 'image']
  } = options

  const materialsInD = Data.empty()

  // @refer: https://developers.weixin.qq.com/miniprogram/dev/framework/material/support_material.html
  // [{type,name,path,size}, ...]
  const materialsRD = replayWithLatest(1, Data.empty())
  binaryTweenPipeAtom(materialsInD, materialsRD)

  const formattedTypes = formatTypes(types)

  const dynamicOutputs = formattedTypes.reduce((acc, type) => {
    const { typeName } = type
    acc[typeName] = replayWithLatest(1, Data.empty())
    acc[`${typeName}s`] = replayWithLatest(1, Data.empty())
    return acc
  }, {})

  materialsRD.subscribeValue(materials => {
    formattedTypes.forEach(({ typeName, mimeType }) => {
      const targets = materials.filter(({ type }) => type === mimeType)
      if (targets.length > 0) {
        dynamicOutputs[`${typeName}s`].mutate(() => targets)
        dynamicOutputs[typeName].mutate(() => targets[0])
      }
    })
  })

  // @refer: https://developers.weixin.qq.com/miniprogram/dev/api/base/app/life-cycle/wx.getEnterOptionsSync.html
  // ! side effects
  if (useDefaultEnterOptions) {
    enterOptionsRD.subscribeValue(({ scene, forwardMaterials }) => {
      if (scene === 1173) {
        materialsRD.mutate(() => forwardMaterials)
      }
    })
  }

  return {
    inputs: {
      materials: materialsInD
    },
    outputs: {
      materials: materialsRD,
      ...dynamicOutputs
    }
  }
}

export const useSupportedMaterialsDriver = useGeneralDriver(supportedMaterialsDriver)
