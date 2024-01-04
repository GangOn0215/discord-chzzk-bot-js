// https://api.chzzk.naver.com/service/v1/channels/${channelID}                 >> 채널 정보
// https://api.chzzk.naver.com/polling/v1/channels/${channelID}/live-status     >> 라이브 상태
// https://api.chzzk.naver.com/service/v1/channels/${chhanelID}/live-detail     >> 라이브 디테일
// https://api.chzzk.naver.com/service/v1/channels/${chhanelID}/videos          >> 채널 비디오
// https://api.chzzk.naver.com/service/v1/videos/{video_no}                     >> 비디오 상세정보

import axios from "axios";
import { ChzzkApi } from "./chzzk.js";

class LiveDetail extends ChzzkApi {
  constructor(channelID) {
    super(channelID);

    this.liveID = 0;
    this.liveTitle = null;
    this.status = null; // { CLOSE || OPEN }
    this.liveImageUrl = null; // 현재 라이브 썸네일
    this.defaultThumbnailImageUrl = null; // 기본 방송 썸네일
    this.concurrentUserCount = 0; // 현재 시청자 수
    this.accumulateCount = 0; // 누적 시청자 수
    this.openDate = null; // 방송 시작 일시 { yyyy-mm-dd H:i:s }
    this.closeDate = null; // 방송 종료 일시 { yyyy-mm-dd H:i:s }
    this.chatChannelId = null; // 방송 채팅 채널 아이디
    this.categoryType = null; // 카테고리
    this.liveCategory = null; // 라이브 카테고리 { talk .. }
    this.chatActive = false; // 채팅 활성화 여부
    this.chatAvailableGroup = null; // { ALL ... }
    this.paidPromotion = false; // 유료 프로모션
    this.chatAvailableCondition = null; // 채팅 조건 { NONE ... }
    this.minFollowerMinute = 0; // 몇분 팔로우 이후 채팅 가능한지
  }

  setchannelID(channelID) {
    this.channelID = channelID;
  }

  getchannelID() {
    return this.channelID;
  }

  async getAxiosLiveDetail() {
    try {
      const chennelInfo = await this.getAxiosChannelInfo(this.channelID);

      if (!chennelInfo) {
        const result = {
          status: false,
          error: "채널 정보가 없습니다.",
        };

        return result;
      }

      const response = await axios(
        `${this.baseURL}/service/v1/channels/${this.channelID}/live-detail`
      );

      if (response.data.code === 200) {
        this.setLiveDetail(response.data.content);

        const result = {
          status: false,
          error: "방송중이 아닙니다.",
        };

        if (this.status === "OPEN") {
          result["status"] = true;

          this.setLiveDetail(response.data.content);
        }

        return result;
      }
    } catch (error) {
      const result = {
        status: false,
        error: error,
      };

      return result;
    }
  }

  setLiveDetail(row) {
    this.liveID = row.liveID;
    this.liveTitle = row.liveTitle;
    this.status = row.status;
    this.liveImageUrl = row.liveImageUrl.replace("{type}", "1080");
    this.defaultThumbnailImageUrl = row.defaultThumbnailImageUrl || "null";
    this.concurrentUserCount = row.concurrentUserCount;
    this.accumulateCount = row.accumulateCount;
    this.openDate = row.openDate;
    this.closeDate = row.closeDate;
    this.chatChannelId = row.chatChannelId;
    this.categoryType = row.categoryType;
    this.liveCategory = row.liveCategory;
    this.chatActive = row.chatActive;
    this.chatAvailableGroup = row.chatAvailableGroup;
    this.paidPromotion = row.paidPromotion;
    this.chatAvailableCondition = row.chatAvailableCondition;
    this.minFollowerMinute = row.minFollowerMinute;
  }
}

export { LiveDetail };
