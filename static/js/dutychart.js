//dutychart.js
import { urlrequest } from "./myrequest.js";
import { config } from "./config.js";

//原始人员
export const requestoriginpersons = async () => {
  let res = [];
  try {
    res = await urlrequest.get(
      `${config.requesturl}/api/dutycalendar/dutypersons`,
      {}
    );
  } catch (error) {
    console.log("error", error);
    throw error;
  }
  return res;
};

export const request_data = async () => {
  let showdata = [];
  if (localStorage.getItem("token")) {
    const all_duty_list = await requestoriginpersons();
    for (let i = 0; i < all_duty_list.length; i++) {
      let p = {
        name: all_duty_list[i]["name"],
        total_duty_count: all_duty_list[i]["total_duty_count"],
        holiday_duty_count: all_duty_list[i]["holiday_duty_count"],
        normal_duty_count: all_duty_list[i]["normal_duty_count"],
        day_shift_count: all_duty_list[i]["day_shift_count"],
        night_shift_count: all_duty_list[i]["night_shift_count"],
      };
      showdata.push(p);
    }
    //从大到小排序
    showdata.sort((a, b) => {
      if (a.total_duty_count === b.total_duty_count) {
        if (a.holiday_duty_count === b.holiday_duty_count) {
          return a.normal_duty_count - b.normal_duty_count;
        }
        return a.holiday_duty_count - b.holiday_duty_count;
      }
      return a.total_duty_count - b.total_duty_count;
    });
  }
  return showdata
}


