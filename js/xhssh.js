
const _scriptSonverterCompatibilityType = typeof $response !== 'undefined' ? 'response' : typeof $request !== 'undefined' ? 'request' : ''
const _scriptSonverterCompatibilityDone = $done
try {
  
// 转换时间: 2024/11/5 12:54:59
// 兼容性转换
if (typeof $request !== 'undefined') {
  const lowerCaseRequestHeaders = Object.fromEntries(
    Object.entries($request.headers).map(([k, v]) => [k.toLowerCase(), v])
  );

  $request.headers = new Proxy(lowerCaseRequestHeaders, {
    get: function (target, propKey, receiver) {
      return Reflect.get(target, propKey.toLowerCase(), receiver);
    },
    set: function (target, propKey, value, receiver) {
      return Reflect.set(target, propKey.toLowerCase(), value, receiver);
    },
  });
}
if (typeof $response !== 'undefined') {
  const lowerCaseResponseHeaders = Object.fromEntries(
    Object.entries($response.headers).map(([k, v]) => [k.toLowerCase(), v])
  );

  $response.headers = new Proxy(lowerCaseResponseHeaders, {
    get: function (target, propKey, receiver) {
      return Reflect.get(target, propKey.toLowerCase(), receiver);
    },
    set: function (target, propKey, value, receiver) {
      return Reflect.set(target, propKey.toLowerCase(), value, receiver);
    },
  });
}
Object.getOwnPropertyNames($httpClient).forEach(method => {
  if(typeof $httpClient[method] === 'function') {
    $httpClient[method] = new Proxy($httpClient[method], {
      apply: (target, ctx, args) => {
        for (let field in args?.[0]?.headers) {
          if (['host'].includes(field.toLowerCase())) {
            delete args[0].headers[field];
          } else if (['number'].includes(typeof args[0].headers[field])) {
            args[0].headers[field] = args[0].headers[field].toString();
          }
        }
        return Reflect.apply(target, ctx, args);
      }
    });
  }
})


// QX 相关
var setInterval = () => {}
var clearInterval = () => {}
var $task = {
  fetch: url => {
    return new Promise((resolve, reject) => {
      if (url.method == 'POST') {
        $httpClient.post(url, (error, response, data) => {
          if (response) {
            response.body = data
            resolve(response, {
              error: error,
            })
          } else {
            resolve(null, {
              error: error,
            })
          }
        })
      } else {
        $httpClient.get(url, (error, response, data) => {
          if (response) {
            response.body = data
            resolve(response, {
              error: error,
            })
          } else {
            resolve(null, {
              error: error,
            })
          }
        })
      }
    })
  },
}

var $prefs = {
  removeValueForKey: key => {
    let result
    try {
      result = $persistentStore.write('', key)
    } catch (e) {
    }
    if ($persistentStore.read(key) == null) return result
    try {
      result = $persistentStore.write(null, key)
    } catch (e) {
    }
    if ($persistentStore.read(key) == null) return result
    const err = '无法模拟 removeValueForKey 删除 key: ' + key
    console.log(err)
    $notification.post('Script Hub: 脚本转换', '❌ xhsbeta.js.txt', err)
    return result
  },
  valueForKey: key => {
    return $persistentStore.read(key)
  },
  setValueForKey: (val, key) => {
    return $persistentStore.write(val, key)
  },
}

var $notify = (title = '', subt = '', desc = '', opts) => {
  const toEnvOpts = (rawopts) => {
    if (!rawopts) return rawopts 
    if (typeof rawopts === 'string') {
      if ('undefined' !== typeof $loon) return rawopts
      else if('undefined' !== typeof $rocket) return rawopts
      else return { url: rawopts }
    } else if (typeof rawopts === 'object') {
      if ('undefined' !== typeof $loon) {
        let openUrl = rawopts.openUrl || rawopts.url || rawopts['open-url']
        let mediaUrl = rawopts.mediaUrl || rawopts['media-url']
        return { openUrl, mediaUrl }
      } else {
        let openUrl = rawopts.url || rawopts.openUrl || rawopts['open-url']
        if('undefined' !== typeof $rocket) return openUrl
        return { url: openUrl }
      }
    } else {
      return undefined
    }
  }
  console.log(title, subt, desc, toEnvOpts(opts))
  $notification.post(title, subt, desc, toEnvOpts(opts))
}
var _scriptSonverterOriginalDone = $done
var _scriptSonverterDone = (val = {}) => {
  let result
  if (
    (typeof $request !== 'undefined' &&
    typeof val === 'object' &&
    typeof val.status !== 'undefined' &&
    typeof val.headers !== 'undefined' &&
    typeof val.body !== 'undefined') || false
  ) {
    try {
      for (const part of val?.status?.split(' ')) {
        const statusCode = parseInt(part, 10)
        if (!isNaN(statusCode)) {
          val.status = statusCode
          break
        }
      }
    } catch (e) {}
    if (!val.status) {
      val.status = 200
    }
    if (!val.headers) {
      val.headers = {
        'Content-Type': 'text/plain; charset=UTF-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST,GET,OPTIONS,PUT,DELETE',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
      }
    }
    result = { response: val }
  } else {
    result = val
  }
  console.log('$done')
  try {
    console.log(JSON.stringify(result))
  } catch (e) {
    console.log(result)
  }
  _scriptSonverterOriginalDone(result)
}
var window = globalThis
window.$done = _scriptSonverterDone
var global = globalThis
global.$done = _scriptSonverterDone

/*
引用地址 https://raw.githubusercontent.com/RuCu6/Loon/main/Scripts/xiaohongshu.js
*/
// 2024-11-05 03:00

const url = $request.url;
const isQuanX = typeof $task !== "undefined";
if (!$response.body) _scriptSonverterDone({});
let obj = JSON.parse($response.body);

if (url.includes("/v1/note/imagefeed") || url.includes("/v2/note/feed")) {
  // 信息流 图片
  if (obj?.data?.length > 0) {
    let data0 = obj.data[0];
    if (data0?.note_list?.length > 0) {
      for (let item of data0.note_list) {
        if (item?.media_save_config) {
          // 水印开关
          item.media_save_config.disable_save = false;
          item.media_save_config.disable_watermark = true;
          item.media_save_config.disable_weibo_cover = true;
        }
        if (item?.share_info?.function_entries?.length > 0) {
          // 下载限制
          const additem = { type: "video_download" };
          let func = item.share_info.function_entries[0];
          if (func?.type !== "video_download") {
            // 向数组开头添加对象
            item.share_info.function_entries.unshift(additem);
          }
        }
      }
    }
    let newDatas = [];
    if (obj?.data?.[0]?.note_list?.[0]?.images_list?.length > 0) {
      for (let item of obj.data[0].note_list[0].images_list) {
        if (
          item?.live_photo_file_id !== "" &&
          item?.live_photo?.media?.video_id !== "" &&
          item?.live_photo?.media?.stream?.h265?.[0]?.master_url !== ""
        ) {
          let myData = {
            file_id: item.live_photo_file_id,
            video_id: item.live_photo.media.video_id,
            url: item.live_photo.media.stream.h265[0].master_url
          };
          newDatas.push(myData);
        }
      }
      // 写入持久化存储
      if (isQuanX) {
        $prefs.setValueForKey(JSON.stringify(newDatas), "redBookLivePhoto");
      } else {
        $persistentStore.write(JSON.stringify(newDatas), "redBookLivePhoto");
      }
    }
  }
} else if (url.includes("/v1/note/live_photo/save")) {
  // 实况照片保存请求
  let livePhoto;
  // 读取持久化存储
  if (isQuanX) {
    livePhoto = JSON.parse($prefs.valueForKey("redBookLivePhoto"));
  } else {
    livePhoto = JSON.parse($persistentStore.read("redBookLivePhoto"));
  }
  if (obj?.data?.datas?.length > 0) {
    // 原始数据没问题 交换url数据
    if (livePhoto?.length > 0) {
      obj.data.datas.forEach((itemA) => {
        livePhoto.forEach((itemB) => {
          if (itemB?.file_id === itemA?.file_id && itemA?.url !== "") {
            itemA.url = itemA.url.replace(/^https?:\/\/.*\.mp4$/g, itemB.url);
          }
        });
      });
    }
  } else {
    // 原始数据有问题 强制返回成功响应
    obj = { code: 0, success: true, msg: "成功", data: { datas: newDatas } };
  }
} else if (url.includes("/v1/system_service/config")) {
  // 整体配置
  const item = ["app_theme", "loading_img", "splash", "store"];
  if (obj?.data) {
    for (let i of item) {
      delete obj.data[i];
    }
  }
} else if (url.includes("/v2/note/widgets")) {
  // 详情页小部件
  const item = ["cooperate_binds", "generic", "note_next_step"];
  // cooperate_binds合作品牌 note_next_step活动
  if (obj?.data) {
    for (let i of item) {
      delete obj.data[i];
    }
  }
} else if (url.includes("/v2/system_service/splash_config")) {
  // 开屏广告
  if (obj?.data?.ads_groups?.length > 0) {
    for (let i of obj.data.ads_groups) {
      i.start_time = 3818332800; // Unix 时间戳 2090-12-31 00:00:00
      i.end_time = 3818419199; // Unix 时间戳 2090-12-31 23:59:59
      if (i?.ads?.length > 0) {
        for (let ii of i.ads) {
          ii.start_time = 3818332800; // Unix 时间戳 2090-12-31 00:00:00
          ii.end_time = 3818419199; // Unix 时间戳 2090-12-31 23:59:59
        }
      }
    }
  }
} else if (url.includes("/v2/user/followings/followfeed")) {
  // 关注页信息流 可能感兴趣的人
  if (obj?.data?.items?.length > 0) {
    // 白名单
    obj.data.items = obj.data.items.filter((i) => i?.recommend_reason === "friend_post");
  }
} else if (url.includes("/v3/note/videofeed")) {
  // 信息流 视频
  if (obj?.data?.length > 0) {
    for (let item of obj.data) {
      if (item?.media_save_config) {
        // 水印开关
        item.media_save_config.disable_save = false;
        item.media_save_config.disable_watermark = true;
        item.media_save_config.disable_weibo_cover = true;
      }
      if (item?.share_info?.function_entries?.length > 0) {
        // 下载限制
        const additem = { type: "video_download" };
        let func = item.share_info.function_entries[0];
        if (func?.type !== "video_download") {
          // 向数组开头添加对象
          item.share_info.function_entries.unshift(additem);
        }
      }
    }
  }
} else if (url.includes("/v4/followfeed")) {
  // 关注列表
  if (obj?.data?.items?.length > 0) {
    // recommend_user可能感兴趣的人
    obj.data.items = obj.data.items.filter((i) => !["recommend_user"]?.includes(i.recommend_reason));
  }
} else if (url.includes("/v4/note/videofeed")) {
  let newDatas = [];
  if (obj?.data?.length > 0) {
    for (let item of obj.data) {
      if (item?.id !== "" && item?.video_info_v2?.media?.stream?.h265?.[0]?.master_url !== "") {
        let myData = {
          id: item.id,
          url: item.video_info_v2.media.stream.h265[0].master_url
        };
        newDatas.push(myData);
      }
    }
    // 写入持久化存储
    if (isQuanX) {
      $prefs.setValueForKey(JSON.stringify(newDatas), "redBookVideoFeed");
    } else {
      $persistentStore.write(JSON.stringify(newDatas), "redBookVideoFeed");
    }
  }
} else if (url.includes("/v5/recommend/user/follow_recommend")) {
  // 用户详情页 你可能感兴趣的人
  if (obj?.data?.title === "你可能感兴趣的人" && obj?.data?.rec_users?.length > 0) {
    obj.data = {};
  }
} else if (url.includes("/v6/homefeed")) {
  if (obj?.data?.length > 0) {
    // 信息流广告
    let newItems = [];
    for (let item of obj.data) {
      if (item?.model_type === "live_v2") {
        // 信息流-直播
        continue;
      } else if (item.hasOwnProperty("ads_info")) {
        // 信息流-赞助
        continue;
      } else if (item.hasOwnProperty("card_icon")) {
        // 信息流-带货
        continue;
      } else if (item?.note_attributes?.includes("goods")) {
        // 信息流-商品
        continue;
      } else {
        if (item?.related_ques) {
          delete item.related_ques;
        }
        newItems.push(item);
      }
    }
    obj.data = newItems;
  }
} else if (url.includes("/v10/note/video/save")) {
  // 视频保存请求
  let videoFeed;
  // 读取持久化存储
  if (isQuanX) {
    videoFeed = JSON.parse($prefs.valueForKey("redBookVideoFeed"));
  } else {
    videoFeed = JSON.parse($persistentStore.read("redBookVideoFeed"));
  }
  if (obj?.data?.note_id !== "" && obj?.data?.download_url !== "") {
    if (videoFeed?.length > 0) {
      for (let item of videoFeed) {
        if (item.id === obj.data.note_id) {
          obj.data.download_url = item.url;
        }
      }
    }
  }
} else if (url.includes("/v10/search/notes")) {
  // 搜索结果
  if (obj?.data?.items?.length > 0) {
    obj.data.items = obj.data.items.filter((i) => i.model_type === "note");
  }
} else {
  _scriptSonverterDone({});
}

_scriptSonverterDone({ body: JSON.stringify(obj) });

} catch (e) {
  console.log('❌ Script Hub 兼容层捕获到原脚本未处理的错误')
  if (_scriptSonverterCompatibilityType) {
    console.log('⚠️ 故不修改本次' + (_scriptSonverterCompatibilityType === 'response' ? '响应' : '请求'))
  } else {
    console.log('⚠️ 因类型非请求或响应, 抛出错误')
  }
  console.log(e)
  if (_scriptSonverterCompatibilityType) {
    _scriptSonverterCompatibilityDone({})
  } else {
    throw e
  }
}
