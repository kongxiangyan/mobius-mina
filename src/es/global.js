import {
  Data,
  replayWithLatest
} from '../libs/mobius-utils.js'

export const wxRD = replayWithLatest(1, Data.of(wx))
export const appRD = replayWithLatest(1, Data.of(getApp({ allowDefault: true })))
