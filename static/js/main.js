import { calendarJs } from "./calendar-js/calendarJs.js";
import { urlrequest } from "./myrequest.js";
import { config } from "./config.js";


//字符串类型的密钥转换为 WordArray 类型；密钥长度需要符合 AES 加密算法的要求，可以是 128、192 或 256 位，如果不足需要进行填充；
const key = CryptoJS.enc.Utf8.parse('012345678123456789101213'); // 呵呵

const intoform = document.getElementById('into-form')
if (intoform){
  intoform.addEventListener('submit', async (event) => {
    event.preventDefault();
    const intostr = document.getElementById('into').value;
    //检查表单是否填写完整
    if (intostr.trim() === '') {
        alert('请填写访问密码！');
        return;
    }

    const encryptedintostr = CryptoJS.AES.encrypt(intostr, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    }).toString();

    let response = "";
    try {
        response = await urlrequest.post( `${config.requesturl}/api/dutycalendar/into`, {
            data:{intostr:encryptedintostr},
        });
  
        if (response.code === 200) {
            document.getElementById('main-content').style.display = 'block'; //通过css样式控制，全靠自觉
            document.getElementById('login-form').style.display = 'none';
        } else {
            alert('密码错误，请重新输入！');
            return;
        }
    } catch (error) {
        console.error('请求失败：', error);
        throw error;
    }
  });
}


const init_today = new Date(); // 默认获取当前时间为日期对象
const curyear = init_today.getFullYear(); // 获取年份
const curmonth = init_today.getMonth() + 1; // 获取月份，需要加1，因为月份是以0开始计数的
const curday = init_today.getDate();

// const curyear = 2023
// const curmonth = 5
// const curday = 1


class CalendarDisplay {
  //构造函数
  constructor() {
    this.option = {};
    //[this.year, this.month, this.day] = this.today.split("-");
    this.dateClass = new DateClass();
    this.duty_cache = {}; //缓存得请求到的数据{date:{all_duty_list,duty_all_len,holiday_full_pointer等}
    this.havethisdb = false; //标记数据库是否有当月数据，这个要全局，每次初始化
    this.bangongshi = {
      id: 2,
      normal_number: 666,
      holiday_number: 666,
      name: "办公室",
      gender: "M",
      phone: "49862926",
      duty_type: "N",
      total_duty_count: 0,
      holiday_duty_count: 0,
      normal_duty_count: 0,
      day_shift_count: 0,
      night_shift_count: 0,
    };
  }

  //找上个月的指针数据等这个月用
  requestDataFunc = async (l_year, last_month) => {
    try {
      const res2list = await urlrequest.get(
        `${config.requesturl}/api/dutycalendar/normaldutyinfo_bymonth`,
        {
          params: {
            date: `${l_year}-${last_month}-1`, //找上个月默认1日的数据。
          },
        }
      );

      let res2 = {};
      //res2list可能为[{...},{...}...]多个或为空[]，//找其中created_at时间最晚的作为最终数据
      if (res2list.length > 0) {
        res2 = [...res2list].sort((a, b) => b.created_at - a.created_at)[0];
      }

      let holiday_full_pointer = 0;
      let last_holiday_not_use = [];
      //let zqgqcj_full_pointer = 0;
      //let last_zqgqcj_not_use = [];
      let normal_full_pointer = 0;
      let leader_normal_pointer = 0
      let leader_holiday_pointer = 0
      let last_normal_not_use = [];
      let thismonthduty_db = [];
      let thismonthduty_db_leader = [];
      if (Object.keys(res2).length > 0) {
        holiday_full_pointer = res2["holiday_full_pointer"];
        last_holiday_not_use = res2["last_holiday_not_use"];
        //zqgqcj_full_pointer = res2["zqgqcj_full_pointer"];
        //last_zqgqcj_not_use = res2["last_zqgqcj_not_use"];
        normal_full_pointer = res2["normal_full_pointer"];
        last_normal_not_use = res2["last_normal_not_use"];
        leader_normal_pointer = res2['leader_normal_pointer'],
        leader_holiday_pointer = res2['leader_holiday_pointer'],
        thismonthduty_db = res2["thismonthduty_db"],
        thismonthduty_db_leader = res2["thismonthduty_db_leader"]
      }

      return [
        holiday_full_pointer,
        last_holiday_not_use,
        //zqgqcj_full_pointer,
        //last_zqgqcj_not_use,
        normal_full_pointer,
        last_normal_not_use,
        leader_holiday_pointer,
        leader_normal_pointer,
        thismonthduty_db,
        thismonthduty_db_leader
      ]; //这个其实是上个月的值班详情，因为请求的是上个月的数据
    } catch (error) {
      console.log(error);
      throw error;
    }
  };


  //原始人员
  requestoriginpersons = async () => {
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
    //console.log("origin", res);
    //return res.filter((item) => item['duty_type'] !== "N");
    return res;
  };

  //原始人员
  requestleaderdutyers = async (ish = true) => {
    let res = [];
    try {
      res = await urlrequest.get(
        `${config.requesturl}/api/dutycalendar/leaderdutyers`,
        {}
      );
    } catch (error) {
      console.log("error", error);
      throw error;
    }
    //console.log("origin", res);
    //return res.filter((item) => item['duty_type'] !== "N");
    if (!ish) {
      //如果不是節假日，需要排除主要
      return res.filter((item) => item['normal_number'] > 0);
    }
    return res;
  };





  //请求curdate全部值班人员安排
  everymonthdutyerqueue = async (curdate) => {
    let res;
    try {
      res = await urlrequest.get(
        `${config.requesturl}/api/dutycalendar/everymonthdutyerqueue`,
        {
          params: {
            date: curdate,
          },
        }
      );
    } catch (error) {
      console.log("error", error);
      throw error;
    }

    if (res.length > 0) {
      const dutyerqueue = JSON.parse(res[0]["dutyerqueue"]);
      const leader_dutyerqueue = JSON.parse(res[0]["leader_dutyerqueue"]);
      return [dutyerqueue, leader_dutyerqueue];
    } else {
      return [[], []]
    }
  };


  // //如果本月没找到人，则请求原始数据之后，post一份到数据库
  // postdutyerqueuetodb = async (year, month, thismonthdutyers) => {
  //   const token = localStorage.getItem("token");
  //   if (token) {
  //     const authorizationheaders = { Authorization: `Bearer ${token}` };
  //     try {
  //       const res = await urlrequest.post(
  //         `${config.requesturl}/api/dutycalendar/everymonthdutyerqueue`,
  //         {
  //           params: {
  //             date: `${year}-${month}-1`,
  //           },
  //           data: {
  //             date: `${year}-${month}-1`,
  //             dutyerqueue: JSON.stringify(thismonthdutyers), //把数组转成字符串
  //           },
  //         },
  //         authorizationheaders
  //       );
  //     } catch (error) {
  //       console.log("error:", error);
  //       throw error;
  //     }
  //   } else {
  //     alert("没有管理员权限，排班人员提交数据库失败！");
  //     this.endloading();//这里结束一下加载中模态框，不然无法登录
  //     return;
  //   }
  // };



  /*//修正_full_pointer。这里有个问题，如果上个月在_full_pointer之前增加人员，那么这个月请求到的
    all_dutyer_list在不修正_full_pointer位置的值肯定不正确，指针需要向前移动人员数量找到正确的起始位置
    ；而如果在指针之后加入人员则不受影响；其次如果减少人员，也不会影响，因为目前采取不删除人员，而是把人员
    的type改为N*/
  correct_full_pointer = (
    last_duty_list,
    this_duty_list,
    _pointer,
  ) => {
    //如果上月没有数据，不做修正
    if (last_duty_list.length === 0) {
      return _pointer;
    }
    const last_json = JSON.stringify(last_duty_list[_pointer]); // 对象不能直接比较
    let res = _pointer;
    for (let i = 0; i < this_duty_list.length; i++) {
      if (JSON.stringify(this_duty_list[i]) === last_json) {
        res = i;
        break;
      }
    }
    return res;
  };


  //请求curdate存在数据库中值班数据
  requestthismonthduty = async (curdate) => {
    let res = [];
    try {
      res = await urlrequest.get(
        `${config.requesturl}/api/dutycalendar/normaldutyinfo_bymonth`,
        {
          params: {
            date: curdate,
          },
        }
      );
    } catch (error) {
      console.log("error", error);
      throw error;
    }

    if (res.length > 0) {
      return [res[0]]; //按照created_at倒序排的，第一个就是最近的吧。。。。还是返回一个数组
    } else {
      return res;
    }
  };

  getdom = (item) => {
    let leader_name = item.children[1].children[0].children[1].children[0];
    let leader_tel = item.children[1].children[0].children[1].children[1];

    //白班1号
    let d_p_1_name = item.children[1].children[1].children[1].children[0];
    let d_p_1_tel = item.children[1].children[1].children[1].children[1];
    //白班2号
    let d_p_2_name = item.children[1].children[1].children[2].children[0];
    let d_p_2_tel = item.children[1].children[1].children[2].children[1];
    //晚班1号
    let e_p_1_name = item.children[1].children[2].children[1].children[0];
    let e_p_1_tel = item.children[1].children[2].children[1].children[1];
    //晚班2号
    let e_p_2_name = item.children[1].children[2].children[2].children[0];
    let e_p_2_tel = item.children[1].children[2].children[2].children[1];

    return {
      leader_name,
      leader_tel,
      //白班1号
      d_p_1_name,
      d_p_1_tel,
      //白班2号
      d_p_2_name,
      d_p_2_tel,
      //晚班1号
      e_p_1_name,
      e_p_1_tel,
      //晚班2号
      e_p_2_name,
      e_p_2_tel,
    };
  };

  initdomdata = (
    leader_name,
    leader_tel,
    d_p_1_name,
    d_p_1_tel,
    d_p_2_name,
    d_p_2_tel,
    e_p_1_name,
    e_p_1_tel,
    e_p_2_name,
    e_p_2_tel
  ) => {
    //非排班日期的全部清空
    leader_name.innerHTML = "领导";
    leader_tel.innerHTML = "0123456";

    //白班1号
    d_p_1_name.innerHTML = "某某某";
    d_p_1_tel.innerHTML = "01234567890";
    //白班2号
    d_p_2_name.innerHTML = "某某某";
    d_p_2_tel.innerHTML = "01234567890";
    //晚班1号
    e_p_1_name.innerHTML = "某某某";
    e_p_1_tel.innerHTML = "01234567890";
    //晚班2号
    e_p_2_name.innerHTML = "某某某";
    e_p_2_tel.innerHTML = "01234567890";
  };

  makeleaderduty = (leader_name, leader_tel) => {
    leader_name.innerHTML = "领导";
    leader_tel.innerHTML = "0123456";
  };

  displayloading = () => {
    // 显示加载中
    const modal = document.querySelector("#loadingModal");
    modal.classList.add("show");
    modal.style.display = "block";
  };

  endloading = () => {
    // 移除加载中
    const modal = document.querySelector("#loadingModal");
    modal.classList.remove("show");
    modal.style.display = "none";
  };

  //排完班把数据post到数据库
  postdatatodb = async (
    year,
    month,
    holiday_full_pointer,
    this_holiday_not_use,
    //zqgqcj_full_pointer,
    //this_zqgqcj_not_use,
    normal_full_pointer,
    this_normal_not_use,
    leader_normal_pointer,
    leader_holiday_pointer,
    thismonthduty,
    thismonthduty_leader
  ) => {
    const token = localStorage.getItem("token");
    if (token) {
      const authorizationheaders = { Authorization: `Bearer ${token}` };
      try {
        const res = await urlrequest.post(
          `${config.requesturl}/api/dutycalendar/normaldutyinfo_bymonth`,
          {
            params: {
              date: `${year}-${month}-1`,
            },
            data: {
              date: `${year}-${month}-1`,
              created_at: Date.now(),
              holiday_full_pointer: holiday_full_pointer,
              last_holiday_not_use: this_holiday_not_use,
              //zqgqcj_full_pointer: zqgqcj_full_pointer,
              //last_zqgqcj_not_use: this_zqgqcj_not_use,
              normal_full_pointer: normal_full_pointer,
              last_normal_not_use: this_normal_not_use,
              leader_normal_pointer: leader_normal_pointer,
              leader_holiday_pointer: leader_holiday_pointer,
              thismonthduty_db: JSON.stringify(thismonthduty), //把数组转成字符串
              thismonthduty_db_leader: JSON.stringify(thismonthduty_leader)
            },
          },
          authorizationheaders
        );
      } catch (e) {
        if (e instanceof DOMException) {
          console.log("DOMException error:", e); //dom加载失败，重新加载
          setTimeout(function () { }, 1000);
        } else {
          console.log("Other error:", e);
        }
        throw e;
      }
    } else {
      alert("没有管理员权限，排班结果提交数据库失败！");
      this.endloading();//这里结束一下加载中模态框，不然无法登录
      return;
    }
  };

  chuli_phone = (arr) => {

    for (let i = 0; i < arr.length; i++) {
      let phone_number = arr[i]['phone']
      arr[i]['phone'] = phone_number.slice(0, 3) + '****' + phone_number.slice(7);//因为arrnotuse是直接关联的原生人员，这里还要再改一下电话号码中间*号
    }
    return arr
  }

  //排完班后按月进行缓存
  make_cache = (
    year,
    month,
    //all_duty_list,
    holiday_full_pointer,
    this_holiday_not_use,
    //zqgqcj_full_pointer,
    //this_zqgqcj_not_use,
    normal_full_pointer,
    this_normal_not_use,
    leader_normal_pointer,
    leader_holiday_pointer,
    thismonthduty,
    thismonthduty_leader
  ) => {
    if (
      !this.duty_cache.hasOwnProperty(`${year}-${month}-1`) ||
      (this.duty_cache.hasOwnProperty(`${year}-${month}-1`) &&
        this.duty_cache[`${year}-${month}-1`]["created_at"] < Date.now())
    ) {

      //处理thismonthduty和not_use的电话号码
      let t_this_holiday_not_use = this.chuli_phone(this_holiday_not_use)
      let t_this_normal_not_use = this.chuli_phone(this_normal_not_use)
      let t_thismonthduty = this.chuli_phone(thismonthduty)


      this.duty_cache[`${year}-${month}-1`] = {
        created_at: Date.now(),
        //all_duty_list: all_duty_list,
        next_holiday_full_pointer: holiday_full_pointer,
        holiday_not_use: t_this_holiday_not_use,
        //next_zqgqcj_full_pointer: zqgqcj_full_pointer,
        //zqgqcj_not_use: this_zqgqcj_not_use,
        next_normal_full_pointer: normal_full_pointer,
        normal_not_use: t_this_normal_not_use,
        leader_normal_pointer: leader_normal_pointer,
        leader_holiday_pointer: leader_holiday_pointer,
        thismonthduty: t_thismonthduty,
        thismonthduty_leader : thismonthduty_leader
      };
    }
  };


  cache_value_leader = (
    p,
    thisdutycache_leader,
    leader_name,
    leader_tel,
  ) => {
    if (p >= thisdutycache_leader.length) {
      return;
    }
    leader_name.innerHTML = thisdutycache_leader[p]["name"];
    leader_tel.innerHTML = thisdutycache_leader[p]["phone"];
    return p + 1;
  }


  //缓存里面赋值操作
  cache_value = (
    p_cache,
    arr,
    d_p_1_name,
    d_p_1_tel,
    d_p_2_name,
    d_p_2_tel,
    e_p_1_name,
    e_p_1_tel,
    e_p_2_name,
    e_p_2_tel
  ) => {

    if (p_cache <= arr.length - 4) {
      d_p_1_name.innerHTML = arr[p_cache]["name"];
      d_p_1_tel.innerHTML = arr[p_cache]["phone"];

      d_p_2_name.innerHTML = arr[p_cache + 1]["name"];
      d_p_2_tel.innerHTML = arr[p_cache + 1]["phone"];

      e_p_1_name.innerHTML = arr[p_cache + 2]["name"];
      e_p_1_tel.innerHTML = arr[p_cache + 2]["phone"];

      e_p_2_name.innerHTML = arr[p_cache + 3]["name"];
      e_p_2_tel.innerHTML = arr[p_cache + 3]["phone"];
      return p_cache + 4; //每天是四个人
    } else {
      return;
    }
  };


  dutycntadd = (ish, isd, arr, idx) => {
    arr[idx]["total_duty_count"] += 1;
    if (ish) {
      arr[idx]["holiday_duty_count"] += 1;
    } else {
      arr[idx]["normal_duty_count"] += 1;
    }
    if (isd === "LEADER") {
      return;
    }
    if (isd) {
      arr[idx]["day_shift_count"] += 1;
    } else {
      arr[idx]["night_shift_count"] += 1;
    }
  };

  // 排领导班
  leader_duty = (
    leaderdutyers,
    leader_all_len,
    _pointer,
    thismonthduty_leader,
    leader_name,
    leader_tel,
    ish
  ) => {
    leader_name.innerHTML = leaderdutyers[_pointer]["name"];
    leader_tel.innerHTML = leaderdutyers[_pointer]["phone"];
    thismonthduty_leader.push(leaderdutyers[_pointer]);
    this.dutycntadd(ish, 'LEADER', leaderdutyers, _pointer);
    _pointer = (_pointer + 1) % leader_all_len;

    return _pointer

  }


  //排班大概白班1、晚班1代码相同；2相同，提出两个函数
  duty_first = (
    all_duty_list,
    arr_not_use,
    _duty_type,
    duty_all_len,
    _full_pointer,
    all_duty_set,
    thismonthduty,
    _p_1_name,
    _p_1_tel,
    ish,
    isd
  ) => {
    let i = 0;
    const len1 = arr_not_use.length; //记录初始长度
    let p1_gender;
    //加个条件，万一之前有个人存没排到存到待选，但是这个月又不值班了
    let flag = false; //标记是否在arr_not_use中找到
    if (len1 > 0) {
      while (
        i < arr_not_use.length &&
        !(
          (arr_not_use[i]["duty_type"] === _duty_type ||
            arr_not_use[i]["duty_type"] === "A") &&
          all_duty_set.has(arr_not_use[i]["id"])
        )
      ) {
        //如果是待选不值，需要删除待选
        if (!all_duty_set.has(arr_not_use[i]["id"])) {
          arr_not_use.splice(i, 1); //已取消值班，删除此人，指针前移了，i不用再向前移动
        } else {
          i++;
        }
      } //while

      if (i < arr_not_use.length) {
        flag = true; //找到了
        p1_gender = arr_not_use[i]["gender"]; //记录第一个性别
        _p_1_name.innerHTML = arr_not_use[i]["name"];
        let phone_number = arr_not_use[i]["phone"]
        _p_1_tel.innerHTML = phone_number.slice(0, 3) + '****' + phone_number.slice(7);//因为arrnotuse是直接关联的原生人员，这里还要再改一下电话号码中间*号

        this.dutycntadd(ish, isd, arr_not_use, i);

        thismonthduty.push(arr_not_use[i]); //这里放入当前月的
        arr_not_use.splice(i, 1); //已使用，删除此人
      }
    }

    //最后是正常轮次，注意len1和arr_not_use.length的区别
    if (len1 === 0 || (len1 > 0 && !flag)) {
      //没有存的，找到第一个能值白天的
      let cnt = 0; //记录找的次数，最多找一遍，一般都找得到吧
      //在没使用过的里面找

      while (
        cnt < duty_all_len &&
        !(
          all_duty_list[_full_pointer]["duty_type"] === "A" ||
          all_duty_list[_full_pointer]["duty_type"] === _duty_type
        )
      ) {
        arr_not_use.push(all_duty_list[_full_pointer]); //指针跑过去了，加入待选
        _full_pointer = (_full_pointer + 1) % duty_all_len;
        cnt++;
      }
      //没找到
      if (cnt === duty_all_len) {
        console.log("error", "没找到能值白班1的");
        return;
      }
      //找到了
      if (
        all_duty_list[_full_pointer]["duty_type"] === "A" ||
        all_duty_list[_full_pointer]["duty_type"] === _duty_type
      ) {
        p1_gender = all_duty_list[_full_pointer]["gender"]; //记录第一个性别
        _p_1_name.innerHTML = all_duty_list[_full_pointer]["name"];
        _p_1_tel.innerHTML = all_duty_list[_full_pointer]["phone"];

        this.dutycntadd(ish, isd, all_duty_list, _full_pointer);

        thismonthduty.push(all_duty_list[_full_pointer]); //这里放入当前月的
        _full_pointer = (_full_pointer + 1) % duty_all_len;
      }
    }

    return [_full_pointer, p1_gender]; //其他参数都是数组，传址的
  };

  duty_second = (
    all_duty_list,
    arr_not_use,
    _duty_type,
    duty_all_len,
    _full_pointer,
    all_duty_set,
    thismonthduty,
    _p_2_name,
    _p_2_tel,
    pre_gender,
    ish,
    isd
  ) => {
    let j = 0;
    const len2 = arr_not_use.length;
    let flag = false; //标记是否在arr_not_use中找到
    if (len2 > 0) {
      while (
        j < arr_not_use.length &&
        !(
          (arr_not_use[j]["duty_type"] === _duty_type ||
            arr_not_use[j]["duty_type"] === "A") &&
          arr_not_use[j]["gender"] === pre_gender &&
          all_duty_set.has(arr_not_use[j]["id"])
        )
      ) {
        //如果是待选不值，需要删除待选
        if (!all_duty_set.has(arr_not_use[j]["id"])) {
          arr_not_use.splice(j, 1); //已取消值班，删除此人，指针前移了，i不用再向前移动
        } else {
          j++;
        }
      } //while

      if (j < arr_not_use.length) {
        flag = true;
        _p_2_name.innerHTML = arr_not_use[j]["name"];
        let phone_number = arr_not_use[j]["phone"]
        _p_2_tel.innerHTML = phone_number.slice(0, 3) + '****' + phone_number.slice(7);//因为arrnotuse是直接关联的原生人员，这里还要再改一下电话号码中间*号
        this.dutycntadd(ish, isd, arr_not_use, j);
        thismonthduty.push(arr_not_use[j]); //这里放入当前月的
        arr_not_use.splice(j, 1); //已使用，删除此人
      }
    } //if len2 >0

    if (len2 === 0 || (len2 > 0 && !flag)) {
      //没找到存货
      //没有存的，找到第二个能值白天的
      let cnt = 0; //记录找的次数，最多找一遍，一般都找得到吧
      //在没使用过的里面找
      while (
        cnt < duty_all_len &&
        !(
          (all_duty_list[_full_pointer]["duty_type"] === "A" ||
            all_duty_list[_full_pointer]["duty_type"] === _duty_type) &&
          all_duty_list[_full_pointer]["gender"] === pre_gender
        )
      ) {
        arr_not_use.push(all_duty_list[_full_pointer]); //指针跑过去了，加入待选

        _full_pointer = (_full_pointer + 1) % duty_all_len;

        cnt++;
      }
      //没找到
      if (cnt === duty_all_len) {
        console.log("error", "没找到能值白班2的");
        return;
      }
      //找到了
      if (
        all_duty_list[_full_pointer]["duty_type"] === "A" ||
        all_duty_list[_full_pointer]["duty_type"] === _duty_type
      ) {
        _p_2_name.innerHTML = all_duty_list[_full_pointer]["name"];
        _p_2_tel.innerHTML = all_duty_list[_full_pointer]["phone"];

        this.dutycntadd(ish, isd, all_duty_list, _full_pointer);

        thismonthduty.push(all_duty_list[_full_pointer]); //这里放入当前月的

        _full_pointer = (_full_pointer + 1) % duty_all_len;
      }
    }
    return _full_pointer;
  };

  //排班
  makeDuty = async (list) => {
    this.displayloading(); //加载
    let if_nodevalue = list[6].attributes["date"].nodeValue; //第6个是第一排最后一个，肯定有数据
    const curmonthdata = if_nodevalue.split("-"); //拿到当月年份和月份
    const year = parseInt(curmonthdata[0]);
    const month = parseInt(curmonthdata[1]);


    //优先级是先查缓存，然后数据库(数据库只存当月的)，最后现排
    let havethiscache = this.duty_cache.hasOwnProperty(`${year}-${month}-1`); //标记缓存是否有月数据
    if (havethiscache) {
      
      let thisdutycache =
        this.duty_cache[`${year}-${month}-1`]["thismonthduty"].slice(); // 做个深拷贝，不然会变的

      let thisdutycache_leader =
        this.duty_cache[`${year}-${month}-1`]["thismonthduty_leader"].slice(); // 做个深拷贝，不然会变的

      let p_cache = 0;
      let p_cache_leader = 0;
      list.forEach((item) => {
        let {
          leader_name,
          leader_tel,
          //白班1号
          d_p_1_name,
          d_p_1_tel,
          //白班2号
          d_p_2_name,
          d_p_2_tel,
          //晚班1号
          e_p_1_name,
          e_p_1_tel,
          //晚班2号
          e_p_2_name,
          e_p_2_tel,
        } = this.getdom(item);

        let else_nodevalue = dayjs(item.attributes["date"].nodeValue);
        if (
          else_nodevalue.isAfter(dayjs(config.startTime)) &&
          else_nodevalue.isBefore(dayjs(config.endTime))
        ) {
          if (!item.classList.contains("notthisMonth")) {

            //this.makeleaderduty(leader_name, leader_tel);

            p_cache_leader = this.cache_value_leader(
              p_cache_leader,
              thisdutycache_leader,
              leader_name,
              leader_tel,
            )

            p_cache = this.cache_value(
              p_cache,
              thisdutycache,
              d_p_1_name,
              d_p_1_tel,
              d_p_2_name,
              d_p_2_tel,
              e_p_1_name,
              e_p_1_tel,
              e_p_2_name,
              e_p_2_tel
            );
          } //thismonth
          else {
            this.initdomdata(
              leader_name,
              leader_tel,
              d_p_1_name,
              d_p_1_tel,
              d_p_2_name,
              d_p_2_tel,
              e_p_1_name,
              e_p_1_tel,
              e_p_2_name,
              e_p_2_tel
            );
          } //notthismonth
        } //if (else_nodevalue.isAfter(dayjs(config.startTime)) && else_nodevalue.isBefore(dayjs(config.endTime)
        else {
          //非排班日期的全部清空
          this.initdomdata(
            leader_name,
            leader_tel,
            d_p_1_name,
            d_p_1_tel,
            d_p_2_name,
            d_p_2_tel,
            e_p_1_name,
            e_p_1_tel,
            e_p_2_name,
            e_p_2_tel
          );
        }
      });
    }
    else if (!havethiscache) {
      //如果没有缓存，先从数据库找。
      const curmonthdutyinfo = await this.requestthismonthduty(
        `${year}-${month}-1`
      );

      let curmonthduty = [];
      let curmonthduty_leader = [];
      if (
        curmonthdutyinfo.length > 0
        // &&curmonthdutyinfo[0]["thismonthduty_db"].length > 0
      ) {
        curmonthduty = JSON.parse(curmonthdutyinfo[0]["thismonthduty_db"]);
        curmonthduty_leader = JSON.parse(curmonthdutyinfo[0]["thismonthduty_db_leader"]);
      }

      //如果数据库有数据，就用数据库的数据（这里其实有问题，万一一个有一个没有呢？）
      if (curmonthduty.length > 0 && curmonthduty_leader.length > 0) {
        //先把当月的缓存一波
        this.make_cache(
          year,
          month,
          //[], //数据库设计问题，但是不想改了，all_duty_list就存个空吧，反正不从这里出
          curmonthdutyinfo[0]["holiday_full_pointer"],
          curmonthdutyinfo[0]["last_holiday_not_use"],
          //curmonthdutyinfo[0]["zqgqcj_full_pointer"],
          //curmonthdutyinfo[0]["last_zqgqcj_not_use"],
          curmonthdutyinfo[0]["normal_full_pointer"],
          curmonthdutyinfo[0]["last_normal_not_use"],
          curmonthdutyinfo[0]["leader_normal_pointer"],
          curmonthdutyinfo[0]["leader_holiday_pointer"],
          curmonthduty,
          curmonthduty_leader
        );

        let p_cache = 0; // 在缓存值班数组里的指针
        let p_cache_leader = 0;
        list.forEach((item) => {
          let {
            leader_name,
            leader_tel,
            //白班1号
            d_p_1_name,
            d_p_1_tel,
            //白班2号
            d_p_2_name,
            d_p_2_tel,
            //晚班1号
            e_p_1_name,
            e_p_1_tel,
            //晚班2号
            e_p_2_name,
            e_p_2_tel,
          } = this.getdom(item);

          let else_nodevalue = dayjs(item.attributes["date"].nodeValue);
          if (
            else_nodevalue.isAfter(dayjs(config.startTime)) &&
            else_nodevalue.isBefore(dayjs(config.endTime))
          ) {
            if (!item.classList.contains("notthisMonth")) {


              //this.makeleaderduty(leader_name, leader_tel);

              p_cache_leader = this.cache_value_leader(
                p_cache_leader,
                curmonthduty_leader,
                leader_name,
                leader_tel,
              )


              p_cache = this.cache_value(
                p_cache,
                curmonthduty,
                d_p_1_name,
                d_p_1_tel,
                d_p_2_name,
                d_p_2_tel,
                e_p_1_name,
                e_p_1_tel,
                e_p_2_name,
                e_p_2_tel
              );
            } //thismonth
            else {
              this.initdomdata(
                leader_name,
                leader_tel,
                d_p_1_name,
                d_p_1_tel,
                d_p_2_name,
                d_p_2_tel,
                e_p_1_name,
                e_p_1_tel,
                e_p_2_name,
                e_p_2_tel
              );
            } //notthismonth
          } //if (else_nodevalue.isAfter(dayjs(config.startTime)) && else_nodevalue.isBefore(dayjs(config.endTime)
          else {
            //非排班日期的全部清空
            this.initdomdata(
              leader_name,
              leader_tel,
              d_p_1_name,
              d_p_1_tel,
              d_p_2_name,
              d_p_2_tel,
              e_p_1_name,
              e_p_1_tel,
              e_p_2_name,
              e_p_2_tel
            );
          }
        });
        this.havethisdb = true; //已采用数据库数据
      } else {
        this.havethisdb = false;
      }
    }

    //没有缓存数据库又没有数据，现场排
    if (!havethiscache && !this.havethisdb) {
      let all_duty_list = [],
        duty_all_len = 0,
        leaderdutyers = [],
        leader_all_len = 0,
        leaderdutyers_normal = [],
        leader_all_len_normal = 0,
        leader_normal_pointer = 0,
        leader_holiday_pointer = 0,
        holiday_full_pointer = 0,
        last_holiday_not_use = 0,
        //zqgqcj_full_pointer,
        //last_zqgqcj_not_use,
        normal_full_pointer = 0,
        last_normal_not_use = [],
        thismonthduty_db = [],
        thismonthduty_db_leader = [],
        p1_gender,
        p3_gender,
        have_this_month_duty = false, //标记本月值班表是否出了
        have_this_month_leader_duty = false; //标记本月值班表是否出了

      const [l_year, last_month] = this.dateClass.get_lastMonth_name(
        year,
        month
      ); //上月名称

      //请求值班队列
      //1.如果是23年5月开始的，就直接找原生dutypersons
      // if (year === parseInt(config.startTime.split('-')[0]) && month === parseInt(config.startTime.split('-')[1])) {
      //   all_duty_list = await this.requestoriginpersons();
      //   //post一个数据,判断是否已post一份去数据库值班队列，这里不用担心刷新后有重复提交的问题，
      //   //既然上面缓存和数据库都没查到，正常情况就是没提交的，这里后面排班提交成功后，后面访问直接从上面进了
      //   await this.postdutyerqueuetodb(year, month, all_duty_list);
      //   have_this_month_duty = true; //五月也给一个post才对
      // }
      // else {
      [all_duty_list, leaderdutyers] = await this.everymonthdutyerqueue(`${year}-${month}-1`);

      if (all_duty_list.length > 0 && leaderdutyers.length > 0) {
        //请求到了月安排表，说明排班安排已经定了，排出的值班表可以存数据库
        have_this_month_duty = true; //这里主要给存数据库用
        have_this_month_leader_duty = true
      } else if (all_duty_list.length <= 0 && leaderdutyers.length > 0) {
        have_this_month_duty = false;
        have_this_month_leader_duty = true
        alert(`${year}年${month}月排班未出，采用目前人员预排，后续会有变动。`);
        //这里如果指定月数据没出，就找一次上一月的，再找不到就用原始的
        [all_duty_list, leaderdutyers] = await this.everymonthdutyerqueue(`${l_year}-${last_month}-1`);
        if (all_duty_list.length === 0) {
          all_duty_list = await this.requestoriginpersons();
        }
      }
      else if (all_duty_list.length > 0 && leaderdutyers.length <= 0) {
        have_this_month_duty = true;
        have_this_month_leader_duty = false
        alert(`${year}年${month}月领导排班未出，采用目前人员预排，后续会有变动。`);
        //这里如果指定月数据没出，就找一次上一月的，再找不到就用原始的
        [all_duty_list, leaderdutyers] = await this.everymonthdutyerqueue(`${l_year}-${last_month}-1`);
        if (leaderdutyers.length === 0) {
          leaderdutyers = await this.requestleaderdutyers();
        }
      } else {
        alert(`${year}年${month}月排班未出，采用目前人员预排，后续会有变动。`);
        all_duty_list = await this.requestoriginpersons();
        leaderdutyers = await this.requestleaderdutyers();
      }
      // }

      duty_all_len = all_duty_list.length;
      leader_all_len = leaderdutyers.length;
      leaderdutyers_normal = leaderdutyers.filter((item) => item['normal_number'] > 0); // 普通領導
      leader_all_len_normal = leaderdutyers_normal.length;

      //排这个月的班，需要上个月的一些指针和人员数据，还是先从缓存找
      if (this.duty_cache.hasOwnProperty(`${l_year}-${last_month}-1`)) {
        holiday_full_pointer =
          this.duty_cache[`${l_year}-${last_month}-1`][
          "next_holiday_full_pointer"
          ];
        last_holiday_not_use =
          this.duty_cache[`${l_year}-${last_month}-1`]["holiday_not_use"];
        /*zqgqcj_full_pointer =
          this.duty_cache[`${l_year}-${last_month}-1`][
          "next_zqgqcj_full_pointer"
          ];
        last_zqgqcj_not_use =
          this.duty_cache[`${l_year}-${last_month}-1`]["zqgqcj_not_use"];*/
        normal_full_pointer =
          this.duty_cache[`${l_year}-${last_month}-1`][
          "next_normal_full_pointer"
          ];
        last_normal_not_use =
          this.duty_cache[`${l_year}-${last_month}-1`]["normal_not_use"];
        //thismonthduty_db = this.duty_cache[`${l_year}-${last_month}-1`]['thismonthduty'];
        leader_normal_pointer = this.duty_cache[`${l_year}-${last_month}-1`][
          "leader_normal_pointer"
        ];
        leader_holiday_pointer = this.duty_cache[`${l_year}-${last_month}-1`][
          "leader_holiday_pointer"
        ];
      }
      else
      //缓存没有，就请求数据库
      {
        [
          holiday_full_pointer,
          last_holiday_not_use,
          //zqgqcj_full_pointer,
          //last_zqgqcj_not_use,
          normal_full_pointer,
          last_normal_not_use,
          leader_holiday_pointer,
          leader_normal_pointer,
          thismonthduty_db,
          thismonthduty_db_leader
        ] = await this.requestDataFunc(l_year, last_month);

        let [last_duty_list, last_leaderdutyers] = await this.everymonthdutyerqueue(`${l_year}-${last_month}-1`); // 请求上月的值班人员
        if (last_duty_list.length > 0) {
          holiday_full_pointer = this.correct_full_pointer(
            last_duty_list,
            all_duty_list,
            holiday_full_pointer,
          );

          normal_full_pointer = this.correct_full_pointer(
            last_duty_list,
            all_duty_list,
            normal_full_pointer
          );
        }
        if (last_leaderdutyers.length > 0) {
          //這裡處理一下領導的序列
          let last_leaderdutyers_normal = last_leaderdutyers.filter((item) => item['normal_number'] > 0); // 普通領導
          leader_holiday_pointer = this.correct_full_pointer(
            last_leaderdutyers,
            leaderdutyers,
            leader_holiday_pointer,
          );

          leader_normal_pointer = this.correct_full_pointer(
            last_leaderdutyers_normal,
            leaderdutyers_normal,
            leader_normal_pointer
          );
        }

        // console.log("校正前", holiday_full_pointer, normal_full_pointer);
        //原指针前增加人员，指针应该随人员后移，这里需要校正pointer

        // console.log("校正后", holiday_full_pointer, normal_full_pointer);
      }

      let thismonthduty = []; //记录切换到的月份值班信息，之后加入到CalendarDisplay.duty_cache里作为缓存
      let thismonthduty_leader = [];
      let this_holiday_not_use =
        last_holiday_not_use.length > 0 ? last_holiday_not_use.slice() : []; //直接做一个深拷贝在上个月后面push这个月没用的;
      let this_normal_not_use =
        last_normal_not_use.length > 0 ? last_normal_not_use.slice() : [];
      // let this_zqgqcj_not_use =
      //     last_zqgqcj_not_use.length > 0 ? last_zqgqcj_not_use.slice() : [];

      let all_duty_set = new Set(
        all_duty_list
          .filter((item) => item["duty_type"] !== "N")
          .map((item) => item["id"])
      ); //存放当月真正要值班的人的id的hash表，用来排除not_use但是下月又不值班的人

      list.forEach((item) => {
        let {
          leader_name,
          leader_tel,
          //白班1号
          d_p_1_name,
          d_p_1_tel,
          //白班2号
          d_p_2_name,
          d_p_2_tel,
          //晚班1号
          e_p_1_name,
          e_p_1_tel,
          //晚班2号
          e_p_2_name,
          e_p_2_tel,
        } = this.getdom(item);

        //这里排班
        //前提 1.starttime 2.!notthisMonth
        //优先级  白天 1.isHolidays  |  1.makeUpday  2.weekend && !makeUpday
        //        晚上 1.isHolidays |  1.makeUpday  2.weekend && !makeUpday 3.其他
        let else_nodevalue = dayjs(item.attributes["date"].nodeValue);
        if (
          else_nodevalue.isAfter(dayjs(config.startTime)) &&
          else_nodevalue.isBefore(dayjs(config.endTime))
        ) {
          if (!item.classList.contains("notthisMonth")) {
            //节假日分普通和中秋国庆春节两条线
            //先白天后晚上拉通，直接顺序排四个人
            //优先从存起来的里面找
            //this.makeleaderduty(leader_name, leader_tel);

            if (item.classList.contains("isHolidays")) {
              //非中秋国庆春节
              // if (!item.classList.contains("iszqgqcj")) {
              ////////////////////////////第一个白天////////////////////////////

              leader_holiday_pointer = this.leader_duty(
                leaderdutyers,
                leader_all_len,
                leader_holiday_pointer,
                thismonthduty_leader,
                leader_name,
                leader_tel,
                true
              );


              [holiday_full_pointer, p1_gender] = this.duty_first(
                all_duty_list,
                this_holiday_not_use,
                "D",
                duty_all_len,
                holiday_full_pointer,
                all_duty_set,
                thismonthduty,
                d_p_1_name,
                d_p_1_tel,
                true,
                true
              );

              ////////////////////////////第二个白天//////////////////////////////////////////
              holiday_full_pointer = this.duty_second(
                all_duty_list,
                this_holiday_not_use,
                "D",
                duty_all_len,
                holiday_full_pointer,
                all_duty_set,
                thismonthduty,
                d_p_2_name,
                d_p_2_tel,
                p1_gender,
                true,
                true
              );

              //////////////////////////////晚班第一个//////////////////////////////

              [holiday_full_pointer, p3_gender] = this.duty_first(
                all_duty_list,
                this_holiday_not_use,
                "E",
                duty_all_len,
                holiday_full_pointer,
                all_duty_set,
                thismonthduty,
                e_p_1_name,
                e_p_1_tel,
                true,
                false
              );

              //////////////////////////////晚班第2个//////////////////////////////////////
              holiday_full_pointer = this.duty_second(
                all_duty_list,
                this_holiday_not_use,
                "E",
                duty_all_len,
                holiday_full_pointer,
                all_duty_set,
                thismonthduty,
                e_p_2_name,
                e_p_2_tel,
                p3_gender,
                true,
                false
              );
              // } //if (!item.classList.contains("iszqgqcj"))
              // else {
              //     //中秋国庆

              //     ////////////////////////////第一个白天////////////////////////////
              //     [zqgqcj_full_pointer, p1_gender] = this.duty_first(
              //         all_duty_list,
              //         this_zqgqcj_not_use,
              //         "D",
              //         duty_all_len,
              //         zqgqcj_full_pointer,
              //         all_duty_set,
              //         thismonthduty,
              //         d_p_1_name,
              //         d_p_1_tel
              //     );

              //     ////////////////////////////第二个白天//////////////////////////////////////////
              //     zqgqcj_full_pointer = this.duty_second(
              //         all_duty_list,
              //         this_zqgqcj_not_use,
              //         "D",
              //         duty_all_len,
              //         zqgqcj_full_pointer,
              //         all_duty_set,
              //         thismonthduty,
              //         d_p_2_name,
              //         d_p_2_tel,
              //         p1_gender
              //     );

              //     //////////////////////////////晚班第一个//////////////////////////////

              //     [zqgqcj_full_pointer, p3_gender] = this.duty_first(
              //         all_duty_list,
              //         this_zqgqcj_not_use,
              //         "E",
              //         duty_all_len,
              //         zqgqcj_full_pointer,
              //         all_duty_set,
              //         thismonthduty,
              //         e_p_1_name,
              //         e_p_1_tel
              //     );

              //     //////////////////////////////晚班第2个//////////////////////////////////////
              //     zqgqcj_full_pointer = this.duty_second(
              //         all_duty_list,
              //         this_zqgqcj_not_use,
              //         "E",
              //         duty_all_len,
              //         zqgqcj_full_pointer,
              //         all_duty_set,
              //         thismonthduty,
              //         e_p_2_name,
              //         e_p_2_tel,
              //         p3_gender
              //     );
              // } //中秋国庆
            } //item.classList.contains('isHolidays')
            else {
              //普通班，一条线拉通
              //非节假日直接白天、晚上1条线

              leader_normal_pointer = this.leader_duty(
                leaderdutyers_normal,
                leader_all_len_normal,
                leader_normal_pointer,
                thismonthduty_leader,
                leader_name,
                leader_tel,
                false
              );


              if (
                item.classList.contains("weekend") &&
                !item.classList.contains("makeUpday")
              ) {
                //非补班的周末，白天、晚上都要//优先在上个月没用的中找

                ////////////////////////////第一个白天////////////////////////////
                [normal_full_pointer, p1_gender] = this.duty_first(
                  all_duty_list,
                  this_normal_not_use,
                  "D",
                  duty_all_len,
                  normal_full_pointer,
                  all_duty_set,
                  thismonthduty,
                  d_p_1_name,
                  d_p_1_tel,
                  false,
                  true
                );

                ////////////////////////////第二个白天//////////////////////////////////////////
                normal_full_pointer = this.duty_second(
                  all_duty_list,
                  this_normal_not_use,
                  "D",
                  duty_all_len,
                  normal_full_pointer,
                  all_duty_set,
                  thismonthduty,
                  d_p_2_name,
                  d_p_2_tel,
                  p1_gender,
                  false,
                  true
                );

                //////////////////////////////晚班第一个//////////////////////////////

                [normal_full_pointer, p3_gender] = this.duty_first(
                  all_duty_list,
                  this_normal_not_use,
                  "E",
                  duty_all_len,
                  normal_full_pointer,
                  all_duty_set,
                  thismonthduty,
                  e_p_1_name,
                  e_p_1_tel,
                  false,
                  false
                );

                //////////////////////////////晚班第2个//////////////////////////////////////
                normal_full_pointer = this.duty_second(
                  all_duty_list,
                  this_normal_not_use,
                  "E",
                  duty_all_len,
                  normal_full_pointer,
                  all_duty_set,
                  thismonthduty,
                  e_p_2_name,
                  e_p_2_tel,
                  p3_gender,
                  false,
                  false
                );
              } //if (item.classList.contains('weekend') && (!item.classList.contains('makeUpday')))
              else {
                //其他白天都是办公室，晚上继续
                d_p_1_name.innerHTML = "办公室";
                d_p_1_tel.innerHTML = "49862926";

                thismonthduty.push(this.bangongshi); //这里放入办公室

                d_p_2_name.innerHTML = "";
                d_p_2_tel.innerHTML = "";

                thismonthduty.push(this.bangongshi); //这里放入办公室

                //////////////////////////////晚班第一个//////////////////////////////

                [normal_full_pointer, p3_gender] = this.duty_first(
                  all_duty_list,
                  this_normal_not_use,
                  "E",
                  duty_all_len,
                  normal_full_pointer,
                  all_duty_set,
                  thismonthduty,
                  e_p_1_name,
                  e_p_1_tel,
                  false,
                  false
                );

                //////////////////////////////晚班第2个//////////////////////////////////////
                normal_full_pointer = this.duty_second(
                  all_duty_list,
                  this_normal_not_use,
                  "E",
                  duty_all_len,
                  normal_full_pointer,
                  all_duty_set,
                  thismonthduty,
                  e_p_2_name,
                  e_p_2_tel,
                  p3_gender,
                  false,
                  false
                );
              } //else (item.classList.contains('weekend') && (!item.classList.contains('makeUpday')))
            } //not holiday
          } //this month
          else {
            this.initdomdata(
              leader_name,
              leader_tel,
              d_p_1_name,
              d_p_1_tel,
              d_p_2_name,
              d_p_2_tel,
              e_p_1_name,
              e_p_1_tel,
              e_p_2_name,
              e_p_2_tel
            );
          } //notthismonth
        } //if dayjs
        else {
          //非排班日期的全部清空
          this.initdomdata(
            leader_name,
            leader_tel,
            d_p_1_name,
            d_p_1_tel,
            d_p_2_name,
            d_p_2_tel,
            e_p_1_name,
            e_p_1_tel,
            e_p_2_name,
            e_p_2_tel
          );
        }
      }); //foreach

      //////////排完之后，把数据post进数据库,这里应该是排班顺序定了就该post////////
      if (have_this_month_duty) {
        await this.postdatatodb(
          year,
          month,
          holiday_full_pointer,
          this_holiday_not_use,
          // zqgqcj_full_pointer,
          // this_zqgqcj_not_use,
          normal_full_pointer,
          this_normal_not_use,
          leader_normal_pointer,
          leader_holiday_pointer,
          thismonthduty,
          thismonthduty_leader
        );


        //其实上面post已经需要权限了,没权限也到不到这里来
        const token = localStorage.getItem("token");
        if (token) {
          const authorizationheaders = { Authorization: `Bearer ${token}` };
          // //然后再修改dutyer的值班次数,sqlite3多了不行要分批
          const batchSize = 50; // 每个批次的大小
          const batches = [];
          for (let i = 0; i < thismonthduty.length; i += batchSize) {
            batches.push(thismonthduty.slice(i, i + batchSize));
          }

          try {
            const promises = batches.map((batch) => {
              return urlrequest.put(
                `${config.requesturl}/api/dutycalendar/dutypersons`,
                {
                  data: batch,
                },
                authorizationheaders
              );
            });
            await Promise.all(promises); //使用 Promise.all() 方法来等待所有的请求都完成后再继续执行
          } catch (error) {
            console.log("error:", error);
            throw error;
          }

          // 修改领导值班次数
          try {
            urlrequest.put(`${config.requesturl}/api/dutycalendar/leaderdutyers`,
                {
                  data: thismonthduty_leader,
                },
                authorizationheaders
              );
          } catch (error) {
            console.log("error:", error);
            throw error;
          }

        } else {
          alert("没有管理员权限，排班次数提交数据库失败！");
          this.endloading();//这里结束一下加载中模态框，不然无法登录
          return;
        }
      }

      //排完班后进行缓存,not_use数组存的是原生数据，缓存的时候要处理电话

      this.make_cache(
        year,
        month,
        //all_duty_list,
        holiday_full_pointer,
        this_holiday_not_use,
        // zqgqcj_full_pointer,
        // this_zqgqcj_not_use,
        normal_full_pointer,
        this_normal_not_use,
        leader_normal_pointer,
        leader_holiday_pointer,
        thismonthduty,
        thismonthduty_leader
      );
    } //排班
    //console.log("查看缓存", this.duty_cache);
    this.endloading(); //在post和缓存后终止动画
  }; //make duty


  /*判断year-month日期是否小月等于当前curyear-curmonth日期，是则返回True,否则返回false*/
  // is_l_or_e = (year, month) => {
  //   if (year < curyear) {
  //     // 如果年份小于当前年份，则一定小于等于当前日期
  //     return true;
  //   } else if (year === curyear && month <= curmonth) {
  //     // 如果年份等于当前年份且月份小于等于当前月份，则小于等于当前日期
  //     return true;
  //   } else {
  //     // 否则大于当前日期
  //     return false;
  //   }
  // };

  get today() {
    return [curyear, curmonth, curday].join("-");
  }

  //设置要显示到左侧表格中的数据，数据改变时更新界面
  /*1将传入的数组赋值给实例的showArr属性，用于右侧日程列表的显示。2遍历日历中的每个日期格子，根据传入的数组中对应的元素，更新格子的显示内容和样式。3如果传入的数组中有某个元素表示的日期不属于当前月份，则将下拉框中的年份和月份设置为该日期所在的年份和月份。4如果传入的数组中有某个元素表示的日期被选中，则将该元素赋值给实例的dayInfo属性，用于右侧日程列表的显示。5根据传入的数组中每个元素的属性，更新对应日期格子的样式，包括是否为节假日、是否为补班日、是否为今天、是否被选中、是否不属于当前月份等。6将每个日期格子的日期信息和样式更新到DOM中。7最后，调用makeDuty方法，用于排班。*/
  /**
   * @param {any[]} arr
   */
  set _mainInfo(arr) {

    this.monthinfo = arr[6].date //第6个是第一排最后一个，肯定有数据，这个用来切上月，下月

    let status = false; // 设置 select 修改状态
    //this.showArr = arr; // 右边显示
    const list = document.querySelectorAll(
      ".calendar-left-main .calendar-main-col"
    );

    list.forEach((item, index) => {
      const {
        notthisMonth,
        date,
        isselected,
        isToday,
        festival,
        lunarFestival,
        Term,
        IDayCn,
        makeUpday,
      } = arr[index];

      if (!status && notthisMonth) {
        status = true;
        this.setSelect(
          document.querySelector(".select-year"),
          date.slice(0, 4)
        );
        this.setSelect(
          document.querySelector(".select-month"),
          date.split("-")[1]
        );
      }

      //arr[index].isselected ? this._rightdayInfo = arr[index] : '' //右边显示的
      isselected ? (this.dayInfo = arr[index]) : ""; //这里给选中日信息赋值
      const t_classList = [];
      if (arr[index].isHolidays) t_classList.push("isHolidays");
      // if (arr[index].iszqgqcj) t_classList.push("iszqgqcj"); //（中秋）国庆春节
      if (makeUpday) t_classList.push("makeUpday");
      if (isToday) t_classList.push("isToday");
      if (isselected) t_classList.push("isselected");
      if (!notthisMonth) t_classList.push("notthisMonth");

      // 优先显示顺序公立节假日 农历假日 节气 农历
      const info = festival || lunarFestival || Term || IDayCn;

      item.classList.remove(
        "isHolidays",
        // "iszqgqcj",
        "makeUpday",
        "isToday",
        "isselected",
        "notthisMonth"
      );
      item.classList.add(...t_classList);

      item.setAttribute("date", date); //这里给每天加一个属性
      item.querySelector(".calendar-col-day-info .yl").innerHTML =
        date.split("-")[2];
      item.querySelector(".calendar-col-day-info .other-info").innerHTML = info;
    });


    // 这里排班
    this.makeDuty(list);
  }

  /*
      //设置当前选中日期的数据并更新右侧界面，默认为当天
      set _rightdayInfo(info) {
          //this.dayInfo = info
          let html = '';
          if (this.dayInfo.IMonthCn && this.dayInfo.IDayCn) html += `<p>${this.dayInfo.IMonthCn + this.dayInfo.IDayCn}</p>`
  
          if (this.dayInfo.Term) html += `<p>${this.dayInfo.Term}</p>`
          html += ` <p>${this.dayInfo.gzYear}年 ${this.dayInfo.Animal}</p>
      <p>${this.dayInfo.gzMonth}月 ${this.dayInfo.gzDay}日</p>
      <p>${this.dayInfo.astro}</p>`
          document.querySelector('.calendar-right-day')
              .innerHTML = info.date.split('-')
                  .map(item => {
                      return this.formatNum(item)
                  })
                  .join('-')
          document.querySelector('.calendar-right-main')
              .innerHTML = this.formatNum(this.dayInfo.date.split('-')[2])
          document.querySelector('.calendar-right-text')
              .innerHTML = html
      }
      */

  //初始化渲染
  render = (opt) => {
    this.options = {
      ...this.option,
      ...opt,
    };
    this.el = document.querySelector(this.options.element);

    // 建立dom
    this.render_dom();
    // 渲染数据
    //console.log("render调用_mainInfo");
    //this._mainInfo = this.dateClass.infos(...this.today.split("-"));
    this._mainInfo = this.dateClass.infos(curyear,curmonth,curday);
    // 绑定动作
    this.bind();
  };

  render_dom = () => {
    //月选项
    let mhtml = "",
      yhtml = "";
    //十二个月
    for (let i = 1; i <= 12; i++) {
      let text = config.monthStr[i - 1];
      mhtml += `<option value="${i}">${text}月</option>`;
    }

    //年选项
    for (let i = config.start_year; i <= config.end_year; i++) {
      yhtml += `<option value="${i}">${i}年</option>`;
    }

    //日期面板
    let rows = "";
    for (let row = 1; row <= 6; row++) {
      //日期每一行
      rows += `<div class="calendar-main-row d-flex">`;
      //周一至周五
      for (let col = 1; col <= 5; col++) {
        rows += `<div class="calendar-main-col hover-bg">
          <div class="calendar-col-day-info">
            <div class ="yl badge bg-primary">
            </div>
            <div class ="other-info badge">
            </div>
          </div>
          <div class="duty">
            
            <div class ="leader">
                <div class ="leader-tag">
                  领导
                </div>
                <div class ="leader-info">
                  <div class ="leader-name">
				   领导
                  </div>
                  <div class ="leader-tel">
                  0123456
                  </div>
                </div>
                <!--这里用一个透明div占位置-->
                <div class ="leader-info"  style="opacity: 0;">
                  <div>
                    占位符
                  </div>
                  <div>
				  0123456
                  </div>
                </div>

            </div>

            <div class ="daytime">
              <div class ="daytime-tag">
                白班
              </div>
              <div class = "d-person-one">
                <div class = "name">某某某</div>
                <div class = "tel">0123456</div>
              </div>
              <div class = "d-person-two">
                <div class = "name">某某某</div>
                <div class = "tel">0123456</div>
              </div>
            </div>

            <div class ="evening">
              <div class ="evening-tag">
                晚班
              </div>
              <div class = "e-person-one">
                <div class = "name">某某某</div>
                <div class = "tel">0123456</div>
              </div>
              <div class = "e-person-two">
                <div class = "name">某某某</div>
                <div class = "tel">0123456</div>
              </div>
            </div>
            
          </div>
        </div>`;
      }

      //周末
      for (let col = 6; col <= 7; col++) {
        rows += `<div class="calendar-main-col hover-bg weekend">
          <div class="calendar-col-day-info">
            <div class ="yl badge bg-warning">
            </div>
            <div class ="other-info badge">
            </div>
          </div>
          <div class="duty">
            
            <div class ="leader">
                <div class ="leader-tag">
                  领导
                </div>
                <div class ="leader-info">
                  <div class ="leader-name">
				  领导
                  </div>
                  <div class ="leader-tel">
                  0123456
                  </div>
                </div>
                
                <div class ="leader-info" style="opacity: 0;">
                  <div>
                    占位符
                  </div>
                  <div>
				  0123456
                  </div>
                </div>

            </div>

            <div class ="daytime">
              <div class ="daytime-tag">
                白班
              </div>
              <div class = "d-person-one">
                <div class = "name">某某某</div>
                <div class = "tel">0123456</div>
              </div>
              <div class = "d-person-two">
                <div class = "name">某某某</div>
                <div class = "tel">0123456</div>
              </div>
            </div>

            <div class ="evening">
              <div class ="evening-tag">
                晚班
              </div>
              <div class = "e-person-one">
                <div class = "name">某某某</div>
                <div class = "tel">0123456</div>
              </div>
              <div class = "e-person-two">
                <div class = "name">某某某</div>
                <div class = "tel">0123456</div>
              </div>
            </div>
            
          </div>
        </div>`;
      }
      rows += `</div>`;
    }

    let html = `
      <div class="calendar-left">
        <div class="calendar-toolbar-top border-bottom">
            <select class="form-select form-select-primary calendar-toolbar-item select-year" aria-label="select-year" disabled>
              ${yhtml}
            </select>
            <select class="form-select form-select-primary calendar-toolbar-item select-month" aria-label="select-month" disabled>
                ${mhtml}
              </select>
            <button type="button" class="btn btn-outline-primary last-month">上一月</button>
            <button type="button" class="calendar-toolbar-item btn btn-outline-primary next-month">下一月</button>
            <button type="button" class="calendar-toolbar-item btn btn-outline-primary back-today">返回今天</button>
            <button type="button" class="calendar-toolbar-item btn btn-outline-warning" id = "dutyerlist">值班人员</button>
            <button type="button" class="calendar-toolbar-item btn btn-outline-danger" id = "analysis">值班统计</button>
            <button type="button" class="btn btn-outline-danger" id = "export-btn">导出值班表</button>
            <button type="button" class="btn btn-outline-danger" id = "loginBtn">登录</button>
            
        </div>
        ${this.render_weeks()}
        <div class="calendar-left-main equalwidth">${rows}</div>
      </div>`;
    this.el.innerHTML = html;
    /*<div class="calendar-right">
        <div class="calendar-right-day"></div>
        <div class="calendar-right-main"></div>
        <div class="calendar-right-text"></div>
        </div>*/
  };

  // 标题星期一至星期日
  render_weeks = () => {
    let html = "";
    for (let i = 1; i <= 7; i++) {
      html += `<div class="calendar-header-item">${config.weekname[i % 7]
        }</div>`;
    }
    return `<div class="calendar-left-header d-flex align-items-center justify-content-center py-3">${html}</div>`;
  };

  //小于10的数字前加0
  formatNum = (num) => {
    return num < 10 ? "0" + num : num;
  };

  //  给工具按钮以及单元格绑定点击事件
  bind = () => {
    // 返回本月，已经是今天则不绑定
    this.el.querySelector(".back-today").addEventListener("click", () => {
      let [y, m, d] = this.monthinfo.split("-");
      y = parseInt(y);
      m = parseInt(m);
      if (y === curyear && m === curmonth) return;
      this._mainInfo = this.dateClass.infos(curyear,curmonth,curday);
    });
    // 选择年份
    let ybtn = this.el.querySelector(".select-year");
    let mbtn = this.el.querySelector(".select-month");
    ybtn.addEventListener("change", () => {
      this._mainInfo = this.dateClass.infos(
        ybtn.value,
        mbtn.value,
        // this.dayInfo.date.split("-")[2]
        1, // 这里直接给个1号
      );
    });
    // 选择月份
    mbtn.addEventListener("change", () => {
      this._mainInfo = this.dateClass.infos(
        ybtn.value,
        mbtn.value,
        // this.dayInfo.date.split("-")[2]
        1
      );
    });
    // 上一月
    this.el.querySelector(".last-month").addEventListener("click", () => {

      let [y, m, d] = this.monthinfo.split("-");
      y = parseInt(y);
      m = parseInt(m);
      d = 1;

      //23年四月之前不给切了
      if ((y === 2023 && m <= 5) || y < 2023) {
        return;
      }

      if (m === 1) {
        m = 12;
        y--;
      } else {
        m--;
      }
      this._mainInfo = this.dateClass.infos(y, m, d);
      return;
    });

    // 下一月
    this.el.querySelector(".next-month").addEventListener("click", () => {

      let [y, m, d] = this.monthinfo.split("-");
      y = parseInt(y);
      m = parseInt(m);
      d = 1;

      if (m === 12) {
        m = 1;
        y++;
      } else {
        m++;
      }

      this._mainInfo = this.dateClass.infos(y, m, d);
      return;
    });

    /**绑定每个日期格子的点击事件，当用户点击某个日期格子时，如果该格子不属于当前月份，则重新渲染日历；否则，将该格子标记为选中状态，并更新右侧的日程列表。 */
    let td = this.el.querySelectorAll(".calendar-main-col");
    td.forEach((item) => {
      item.addEventListener("click", () => {
        let date = item.getAttribute("date");
        if (item.classList.contains("notthisMonth")) {
          this._mainInfo = this.dateClass.infos(...date.split("-"));
        } else {
          td.forEach((list) => {
            list.classList.remove("isselected");
          }); //删除之前的选中
          item.classList.add("isselected");

          /*this.showArr.filter(list => {
                    return list.date == date
                })[0]是每天的选中信息
                this._rightdayInfo = this.showArr.filter(list => {
                    return list.date == date
                })[0]*/
        }
      });
    });
  };

  /**
   * 传入select Dom和值动态改变select当前选中状态
   * @param {object} el select元素 dom对象
   * @param {string} val select选中的值
   */
  setSelect = (el, val) => {
    for (let i = 0; i < el.options.length; i++) {
      if (el.options[i].value === val) el.options[i].selected = true;
    }
  };
}

/**
 * 日期信息操作类
 */
class DateClass {
  // 获得当前月份第一天是星期几,m是真实月份，获取星期数字，0代表星期日，1代表星期一，6代表星期六
  get_firstday_the_week_by_ym = (y, m) => {
    return dayjs(`${y}-${m}`).startOf("month").day();
  };

  // 获取阳历月有几天，这里进来的m从1开始的真是月份
  getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };

  //获取下一个月,这里m是1开始真实月份名称
  get_nextMonth_name = (y, m) => {
    const nextDate = dayjs(`$${y}-${m}`).add(1, "month");
    return [nextDate.year(), nextDate.month() + 1]; //只返回年月
  };

  get_lastMonth_name = (y, m) => {
    const lastDate = dayjs(`${y}-${m}`).subtract(1, "month");
    return [lastDate.year(), lastDate.month() + 1]; //只返回年月
  };

  // 每月7*6 数据,这里的month是真实的月份
  cal_xx_month_days = (cur_year, cur_month) => {
    // 当月天数
    const cur_days = this.getDaysInMonth(cur_year, cur_month);

    //上月和下月名称
    const [l_year, last_month] = this.get_lastMonth_name(cur_year, cur_month);
    const [n_year, next_month] = this.get_nextMonth_name(cur_year, cur_month);

    const start = this.get_firstday_the_week_by_ym(cur_year, cur_month);

    const next_month_fill = config.RC - start - cur_days + 1; // 6行7列；下月天数填充本月

    const month_days_info = []; //月日历7*6个格子填充
    for (let i = 0; i < config.RC - next_month_fill; i++) {
      // 填充上月天数
      if (i < start - 1) {
        /*cur_month: 'lastmonth',*/
        let month = last_month;
        let days =
          this.getDaysInMonth(l_year, last_month) - (start - 1) + i + 1;
        month_days_info.push(`${l_year}-${month}-${days}`);

        //本月
      } else if (i >= start - 1 && i < cur_days + start - 1) {
        /*cur_month: "curmonth",*/
        let month = cur_month;
        let days = i - start + 2;
        month_days_info.push(`${cur_year}-${month}-${days}`);
      }
    }
    //下月填充
    let nxtidx = 1;
    for (let i = start + cur_days - 1; i < config.RC; i++) {
      /*cur_month: "nextmonth"*/
      let month = next_month;
      let days = nxtidx;
      month_days_info.push(`${n_year}-${month}-${days}`);
      nxtidx += 1;
    }
    return month_days_info;
  };

  /**
   * 获取要显示的日期信息
   * @param {number} y 年
   * @param {number} m 月
   * @param {number} d 日
   * @returns {array} 返回要显示的日期及其详细信息
   */
  infos = (y, m, d) => {
    let arr = [];
    this.cal_xx_month_days(y, m, d).forEach((item) => {
      let obj = this.getDayInfo(...item.split("-"));
      obj.isselected =
        y == item.split("-")[0] &&
        m == item.split("-")[1] &&
        d == item.split("-")[2];
      obj.notthisMonth = m == item.split("-")[1];
      arr.push(obj);
    });
    return arr;
  };

  /**
   * 根据公历日期获取当天信息
   * @param {number} y 年
   * @param {number} m 月
   * @param {number} d 日
   * @returns {object} 根据公历日期获取当天所有信息
   */
  getDayInfo = (y, m, d) => {
    let obj = calendarJs.solar2lunar(y, m, d);
    obj.isHolidays = this.isHoliday(y, m, d);
    // obj.iszqgqcj = this.is_zq_gq_cj(y, m, d);
    obj.makeUpday = this.isMakeupDay(y, m, d);
    return obj;
  };

  /**
   * 是否法定节假日
   * @param {number} y 年
   * @param {number} m 月
   * @param {number} d 日
   * @returns {boolean} 是否法定节假日
   */
  isHoliday = (y, m, d) => {
    for (let i = 0; i < config.Holidays.length; i++) {
      let year = parseInt(config.Holidays[i].slice(0, 4));
      let month = parseInt(config.Holidays[i].slice(4, 6));
      let day = parseInt(config.Holidays[i].slice(6));
      if (y == year && m == month && day == d) {
        return true;
      }
    }
    return false;
  };

  /**
   * 是否国庆、春节
   * @param {number} y 年
   * @param {number} m 月
   * @param {number} d 日
   * @returns {boolean} 是否法定节假日
   */
  /*
    is_zq_gq_cj = (y, m, d) => {
        for (let i = 0; i < config.zq_gq_cj.length; i++) {
            let year = parseInt(config.zq_gq_cj[i].slice(0, 4));
            let month = parseInt(config.zq_gq_cj[i].slice(4, 6));
            let day = parseInt(config.zq_gq_cj[i].slice(6));
            if (y == year && m == month && day == d) {
                return true;
            }
        }
        return false;
    };*/


  /**
   * 是否补班
   * @param {number} y 年
   * @param {number} m 月
   * @param {number} d 日
   * @returns {boolean}
   */
  isMakeupDay = (y, m, d) => {
    for (let i = 0; i < config.MakeUpdays.length; i++) {
      let year = parseInt(config.MakeUpdays[i].slice(0, 4));
      let month = parseInt(config.MakeUpdays[i].slice(4, 6));
      let day = parseInt(config.MakeUpdays[i].slice(6));
      if (y == year && m == month && day == d) {
        return true;
      }
    }
    return false;
  };
}

let calendardisplay = new CalendarDisplay();
export { calendardisplay };
