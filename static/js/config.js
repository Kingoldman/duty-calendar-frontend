
// 配置
export let config = {
    start_year: 1900, //年选项
    end_year: 2300,
  
    // 6行7列
    RC: 42,
    // 节假日，每年更新
    Holidays: [
      "20230101",
      "20230102",
      "20230121",
      "20230122",
      "20230123",
      "20230124",
      "20230125",
      "20230126",
      "20230127",
      "20230405",
      "20230429",
      "20230430",
      "20230501",
      "20230502",
      "20230503",
      "20230622",
      "20230623",
      "20230624",
      "20230929",
      "20230930",
      "20231001",
      "20231002",
      "20231003",
      "20231004",
      "20231005",
      "20231006",
      "20231230",
      "20231231",
      "20240101",
      //下面推测24年春节
      "20240209",
      "20240210",
      "20240211",
      "20240212",
      "20240213",
      "20240214",
      "20240215",
    ],
    //国庆春节单独拿出来排班，如果中秋跟国庆连一起，就则放进去
    // zq_gq_cj: [
    //     "20230929",
    //     "20230930",
    //     "20231001",
    //     "20231002",
    //     "20231003",
    //     "20231004",
    //     "20231005",
    //     "20231006",
    //     //下面推测24年春节
    //     "20240209",
    //     "20240210",
    //     "20240211",
    //     "20240212",
    //     "20240213",
    //     "20240214",
    //     "20240215",
    // ],
    //补班，每年更新
    MakeUpdays: [
      "20230128",
      "20230129",
      "20230423",
      "20230506",
      "20230625",
      "20231007",
      "20231008",
    ],
  
    //['日','一','二','三','四','五','六','七']
    weekname: [
      "\u65e5",
      "\u4e00",
      "\u4e8c",
      "\u4e09",
      "\u56db",
      "\u4e94",
      "\u516d",
      "\u4e03",
    ],
  
    monthStr: [
      "一",
      "二",
      "三",
      "四",
      "五",
      "六",
      "七",
      "八",
      "九",
      "十",
      "十一",
      "十二",
    ],
  
    startTime: "2023-5-3", //排班时间区间
    endTime: "2024-2-16",
    requesturl: "https://wanghaiyang900627.pythonanywhere.com/"
  };