/*
引用地址RuCu6
*/
// 2025-02-02 19:40

const url = $request.url;
if (!$response.body) $done({});
let obj = JSON.parse($response.body);

// 优化后的流选择函数
function selectBestStream(streams) {
  if (!streams?.length) return null;

  let maxScore = 0;
  let bestStream = streams[0];
  
  // 优先处理HDR流
  const hdrStreams = streams.filter(s => s?.hdr_type === 1);
  const candidateStreams = hdrStreams.length ? hdrStreams : streams;

  for (const stream of candidateStreams) {
      // 动态计算分辨率（考虑旋转情况）
      const isPortrait = stream.height > stream.width;
      const displayWidth = isPortrait ? stream.height : stream.width;
      const displayHeight = isPortrait ? stream.width : stream.height;
      
      // 评分规则：分辨率 + 码率权重
      const resolutionScore = displayWidth * displayHeight;
      const bitrateWeight = stream.video_bitrate * 0.0001;
      const totalScore = resolutionScore + bitrateWeight;

      // 特殊处理HDR流
      const hdrBonus = stream.hdr_type === 1 ? 1000000 : 0;

      if ((totalScore + hdrBonus) > maxScore) {
          maxScore = totalScore + hdrBonus;
          bestStream = stream;
      }
  }
  return bestStream;
}
if (url.includes("/v1/note/imagefeed") || url.includes("/v2/note/feed")) {
  // 信息流 图片
  let newDatas = [];
  if (obj?.data?.[0]?.note_list?.length > 0) {
    for (let item of obj.data[0].note_list) {
      if (item?.media_save_config) {
        // 水印开关
        item.media_save_config.disable_save = false;
        item.media_save_config.disable_watermark = true;
        item.media_save_config.disable_weibo_cover = true;
      }
      if (item?.share_info?.function_entries?.length > 0) {
        // 视频下载限制
        const additem = { type: "video_download" };
        // 检查是否存在 video_download 并获取其索引
        let videoDownloadIndex = item.share_info.function_entries.findIndex((i) => i?.type === "video_download");
        if (videoDownloadIndex !== -1) {
          // 如果存在，将其移动到数组的第一个位置
          let videoDownloadEntry = item.share_info.function_entries.splice(videoDownloadIndex, 1)[0];
          item.share_info.function_entries.splice(0, 0, videoDownloadEntry);
        } else {
          // 如果不存在，在数组开头添加一个新的 video_download 对象
          item.share_info.function_entries.splice(0, 0, additem);
        }
      }
      if (item?.images_list?.length > 0) {
        for (let i of item.images_list) {
          if (i.hasOwnProperty("live_photo_file_id") && i.hasOwnProperty("live_photo")) {
            if (
              i?.live_photo_file_id !== "" &&
              i?.live_photo?.media?.video_id !== "" &&
              i?.live_photo?.media?.stream?.h265?.[0]?.master_url !== ""
            ) {
              let myData = {
                file_id: i.live_photo_file_id,
                video_id: i.live_photo.media.video_id,
                url: i.live_photo.media.stream.h265[0].master_url
              };
              newDatas.push(myData);
            }
            // 写入持久化存储
            $persistentStore.write(JSON.stringify(newDatas), "redBookLivePhoto");
          }
        }
      }
    }
  }
} else if (url.includes("/v1/note/live_photo/save")) {
  // 实况照片保存请求
  let livePhoto = JSON.parse($persistentStore.read("redBookLivePhoto")); // 读取持久化存储
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
    obj = { code: 0, success: true, msg: "成功", data: { datas: livePhoto } };
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
  const item = ["cooperate_binds", "generic", "note_next_step", "widgets_ndb", "widgets_ncb"];
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
        // 视频下载限制
        const additem = { type: "video_download" };
        // 检查是否存在 video_download 并获取其索引
        let videoDownloadIndex = item.share_info.function_entries.findIndex((i) => i?.type === "video_download");
        if (videoDownloadIndex !== -1) {
          // 如果存在，将其移动到数组的第一个位置
          let videoDownloadEntry = item.share_info.function_entries.splice(videoDownloadIndex, 1)[0];
          item.share_info.function_entries.splice(0, 0, videoDownloadEntry);
        } else {
          // 如果不存在，在数组开头添加一个新的 video_download 对象
          item.share_info.function_entries.splice(0, 0, additem);
        }
      }
    }
  }
} else if (url.includes("/v4/followfeed")) {
  // 关注列表
  if (obj?.data?.items?.length > 0) {
    // recommend_user可能感兴趣的人
    obj.data.items = obj.data.items.filter((i) => !["recommend_user"]?.includes(i?.recommend_reason));
  }
} else if (url.includes("/v4/note/videofeed")) {
  let newDatas = [];
    if (obj?.data?.length) {
        obj.data.forEach(item => {
            if (item.ad) return;

            const streams = item?.video_info_v2?.media?.stream?.h265;
            const bestStream = selectBestStream(streams);
            
            if (bestStream?.master_url) {
                newDatas.push({
                    id: item.id,
                    url: bestStream.master_url,
                    hdr: bestStream.hdr_type === 1,
                    width: bestStream.width,
                    height: bestStream.height
                });
            }
            if (item?.share_info?.function_entries?.length > 0) {
              // 视频下载限制
              const additem = { type: "video_download" };
              // 检查是否存在 video_download 并获取其索引
              let videoDownloadIndex = item.share_info.function_entries.findIndex((i) => i?.type === "video_download");
              if (videoDownloadIndex !== -1) {
                // 如果存在，将其移动到数组的第一个位置
                let videoDownloadEntry = item.share_info.function_entries.splice(videoDownloadIndex, 1)[0];
                item.share_info.function_entries.splice(0, 0, videoDownloadEntry);
              } else {
                // 如果不存在，在数组开头添加一个新的 video_download 对象
                item.share_info.function_entries.splice(0, 0, additem);
              }
            }
        });
        $persistentStore.write(JSON.stringify(newDatas), "redBookVideoFeed");
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
      } else if (item.hasOwnProperty("note_attributes")) {
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
  const videoFeed = JSON.parse($persistentStore.read("redBookVideoFeed") || "[]");
  const targetVideo = videoFeed.find(v => v.id === obj.data?.note_id);
  
  if (targetVideo) {
      // 优先使用原始HDR链接
      obj.data.download_url = targetVideo.url;
      // 强制解锁下载限制
      delete obj.data.disable;
      delete obj.data.msg;
      obj.data.status = 2;
  }
} else if (url.includes("/v10/search/notes")) {
  // 搜索结果
  if (obj?.data?.items?.length > 0) {
    obj.data.items = obj.data.items.filter((i) => i?.model_type === "note");
  }
} else {
  $done({});
}

$done({ body: JSON.stringify(obj) });
