import buildInDrivers from "@wechatsync/drivers";

const {
  JianShuAdapter,
  ZhiHuAdapter,
  WordpressAdapter,
  ToutiaoAdapter,
  WeiboAdapter,
  SegmentfaultAdapter,
  JuejinAdapter,
  CSDNAdapter,
  CnblogAdapter,
  WeixinAdapter,
  YiDianAdapter,
  DoubanAdapter,
  BilibiliAdapter,
  _51CtoAdapter,
  FocusAdapter,
  DiscuzAdapter,
  SoHuAdapter
} = buildInDrivers;

var _cacheState = {}
const _customDrivers = {};

export function addCustomDriver(name, driverClass) {
  _customDrivers[name] = {
    name: name,
    handler: driverClass
  }
  console.log('addCustomDriver', _customDrivers)
}

export function getDriver(account) {

  // 保证在内置的前面
  if(_customDrivers[account.type]) {
    const driverInCustom = _customDrivers[account.type]
    return new driverInCustom['handler'](account)
  }

  if (account.type == 'wordpress') {
    return new WordpressAdapter(
      account.params.wpUrl,
      account.params.wpUser,
      account.params.wpPwd
    )
  }

  if (account.type == 'zhihu') {
    return new ZhiHuAdapter()
  }

  if (account.type == 'jianshu') {
    return new JianShuAdapter()
  }

  if (account.type == 'typecho') {
    return new WordpressAdapter(
      account.params.wpUrl,
      account.params.wpUser,
      account.params.wpPwd,
      true
    )
  }

  if (account.type == 'toutiao') {
    return new ToutiaoAdapter()
  }

  if (account.type == 'bilibili') {
    return new BilibiliAdapter({
      globalState: _cacheState,
      state: _cacheState[account.type],
    })
  }

  if (account.type == 'weibo') {
    return new WeiboAdapter()
  }

  if (account.type == 'sohufocus') {
    return new FocusAdapter()
  }

  if (account.type == '51cto') {
    return new _51CtoAdapter()
  }

  if (account.type == 'segmentfault') {
    return new SegmentfaultAdapter(account)
  }

  if (account.type == 'juejin') {
    return new JuejinAdapter(account)
  }

  if (account.type == 'csdn') {
    return new CSDNAdapter(account)
  }

  if (account.type == 'cnblog') {
    return new CnblogAdapter(account)
  }
  if (account.type == 'weixin') {
    return new WeixinAdapter(account)
  }

  if (account.type == 'yidian') {
    return new YiDianAdapter(account)
  }

  if(account.type == 'douban') {
    console.log(account.type)
    return new DoubanAdapter({
      globalState: _cacheState,
      state: _cacheState[account.type],
    })
  }

  if(account.type == 'discuz') {
    console.log('discuz', account)
    return new DiscuzAdapter(account.config)
  }

  if (account.type == 'sohu') {
    return new SoHuAdapter(account)
  }

  throw Error('not supprt account type')
}

export async function getPublicAccounts() {
  console.log('getPublicAccounts')
  var drivers = [
    new SegmentfaultAdapter(),
    new CSDNAdapter(),
    new JuejinAdapter(),
    new CnblogAdapter(),
    new WeiboAdapter(),
    new ZhiHuAdapter(),
    new JianShuAdapter(),
    new ToutiaoAdapter(),
    new WeixinAdapter(),
    new YiDianAdapter(),
    new DoubanAdapter(),
    new BilibiliAdapter(),
    new _51CtoAdapter(),
    new FocusAdapter(),
  ]

  var customDiscuzEndpoints = ['https://www.51hanghai.com'];
  customDiscuzEndpoints.forEach(_ => {
    drivers.push(new DiscuzAdapter({
      url: _,
   }));
  })

  for (let index = 0; index < _customDrivers.length; index++) {
    const _customDriver = _customDrivers[index];
    try {
      drivers.push(new _customDriver['handler']());
    } catch (e) {
      console.log('initlaze custom driver error', e)
    }
  }

  var users = []
  for (let index = 0; index < drivers.length; index++) {
    const driver = drivers[index]
    try {
      var user = await driver.getMetaData()
      users.push(user)
    } catch (e) {
      console.log(e)
    }
  }
  return users
}

function getCookie(name, cookieStr) {
  let arr,
    reg = new RegExp('(^| )' + name + '=([^;]*)(;|$)')
  if ((arr = cookieStr.match(reg))) {
    return unescape(arr[2])
  } else {
    return ''
  }
}

function urlHandler(details) {
  if (
    details.url.indexOf('api.bilibili.com') >
    -1
  ) {
    var cookieHeader = details.requestHeaders.filter(h => {
      return h.name.toLowerCase() == 'cookie'
    })

    if (cookieHeader.length) {
      var cookieStr = cookieHeader[0].value
      var bili_jct = getCookie('bili_jct', cookieStr)
      if (bili_jct) {
        _cacheState['bilibili'] = _cacheState['bilibili'] || {};
        Object.assign(_cacheState['bilibili'], {
          csrf: bili_jct,
        })
        console.log('bili_jct', bili_jct, details)
      }
    }
    // console.log('details.requestHeaders', details)
  }
  // https://music.douban.com/subject/24856133/new_review
  if (
    details.url.indexOf('music.douban.com') >
    -1
    &&
    details.url.indexOf('/new_review') >
    -1
  ) {
    _cacheState['douban'] = _cacheState['douban'] || {};
    Object.assign(_cacheState['douban'], {
      is_review: true,
      subject: 'music',
      url: details.url,
      id: details.url.replace('https://music.douban.com/subject/', '')
      .replace('/new_review', '')
    })
  }
}

export function getMeta() {
  return {
    version: '0.0.11',
    versionNumber: 12,
    log: '',
    urlHandler: urlHandler,
    inspectUrls: ['*://api.bilibili.com/*', '*://music.douban.com/*'],
  }
}

// DEVTOOL_PLACEHOLDER_INSERT