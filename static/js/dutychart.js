//dutychart.js
import { urlrequest } from "./myrequest.js";
import { config } from "./config.js";

//原始人员
const requestoriginpersons = async () => {
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

const request_data = async () => {
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




const render = (showdata, opt) => {
  const el1 = document.querySelector(opt.element1);
  const myChart1 = echarts.init(el1, null, {
    renderer: "canvas",
    useDirtyRect: false,
  });
  const option1 = {
    title: {
      text: "按类型分{highlight|（右侧滑块拉伸、移动区间）}",
      textStyle: {
        fontSize: 14,
        fontWeight: "bold",
        rich: {
          highlight: {
            color: "#00b28b",
            fontSize: 14,
          },
        },
      },
    },
    legend: {},
    tooltip: {
      trigger: "axis",
      axisPointer: {
        // 坐标轴指示器，坐标轴触发有效
        type: "shadow", // 默认为直线，可选为：'line' | 'shadow'
      },
    },
    dataZoom: {
      //滑动
      type: "slider",
      name: "数据滑块",
      start: 70, // 设置初始显示的 start 位置为0
      end: 100,
      yAxisIndex: 0,
      filterMode: "empty",
      // 设置提示框
      tooltip: {
        show: true,
        formatter: "{start}-{end}",
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "value",
    },
    yAxis: {
      type: "category",
      data: showdata.map((item) => item.name), // y 轴为人名
      // 设置轴标签和轴刻度线的间距
      axisLabel: {
        margin: 14, // 调整轴标签和轴刻度线的间距
        fontSize: 14,
        // 禁止自动旋转轴标签
        rotate: 0,
        // 根据实际情况调整 interval 属性
        interval: "auto",
      },
      // 设置轴刻度线的长度
      axisTick: {
        alignWithLabel: true,
        length: 10,
      },
    },
    series: [
      // {
      //   name: "总值班次数",
      //   type: "bar",
      //   stack: "total",
      //   label: {
      //     show: true,
      //     fontSize: 12,
      //   },
      //   data: showdata.map((item) => item.total_duty_count),
      // },
      {
        name: "节假日班次数",
        type: "bar",
        stack: "total",
        label: {
          show: true,
          fontSize: 14,
        },
        emphasis: {
          focus: "series",
        },
        data: showdata.map((item) => item.holiday_duty_count),
      },
      {
        name: "普通班次数",
        type: "bar",
        stack: "total",
        label: {
          show: true,
          fontSize: 14,
        },
        emphasis: {
          focus: "series",
        },
        data: showdata.map((item) => item.normal_duty_count),
      },
    ],
    color: ["#fc8452", "#73c0de", "#9a60b4", "#3ba272", "#ea7ccc"], // 这里设置另外的色块颜色
  };

  myChart1.setOption(option1);
  window.addEventListener("resize", myChart1.resize);

  //第二个表格
  const el2 = document.querySelector(opt.element2);
  const myChart2 = echarts.init(el2, null, {
    renderer: "canvas",
    useDirtyRect: false,
  });
  const option2 = {
    title: {
      text: "按时间分{highlight|（右侧滑块拉伸、移动区间）}",
      textStyle: {
        fontSize: 14,
        fontWeight: "bold",
        rich: {
          highlight: {
            color: "#00b28b",
            fontSize: 14,
          },
        },
      },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        // 坐标轴指示器，坐标轴触发有效
        type: "shadow", // 默认为直线，可选为：'line' | 'shadow'
      },
    },
    dataZoom: {
      //滑动
      type: "slider",
      name: "数据滑块",
      start: 70, // 设置初始显示的 start 位置为0
      end: 100,
      yAxisIndex: 0,
      filterMode: "empty",
      // 设置提示框
      tooltip: {
        show: true,
        formatter: "{start}-{end}",
      },
    },

    legend: {},
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "value",
    },
    yAxis: {
      type: "category",
      data: showdata.map((item) => item.name), // y 轴为人名
      // 设置轴标签和轴刻度线的间距
      axisLabel: {
        margin: 14, // 调整轴标签和轴刻度线的间距
        fontSize: 14,
        // 禁止自动旋转轴标签
        rotate: 0,
        // 根据实际情况调整 interval 属性
        interval: "auto",
      },
      // 设置轴刻度线的长度
      axisTick: {
        alignWithLabel: true,
        length: 10,
      },
    },
    series: [
      // {
      //   name: "总值班次数",
      //   type: "bar",
      //   stack: "total",
      //   label: {
      //     show: true,
      //     fontSize: 12,
      //   },
      //   data: showdata.map((item) => item.total_duty_count),
      // },
      {
        name: "白班次数",
        type: "bar",
        stack: "total",
        label: {
          show: true,
          fontSize: 14,
        },
        emphasis: {
          focus: "series",
        },
        data: showdata.map((item) => item.day_shift_count),
      },
      {
        name: "晚班次数",
        type: "bar",
        stack: "total",
        label: {
          show: true,
          fontSize: 14,
        },
        emphasis: {
          focus: "series",
        },
        data: showdata.map((item) => item.night_shift_count),
      },
    ],
    color: ["#5470c6", "#91cc75", "#fac858", "#ee6666", "#73c0de"], // 这里设置色块颜色
  };
  myChart2.setOption(option2);
  window.addEventListener("resize", myChart2.resize);
};



const displayloading = () => {
  // 显示加载中
  const modal = document.querySelector("#loadingModal");
  modal.classList.add("show");
  modal.style.display = "block";
};

const endloading = () => {
  // 移除加载中
  const modal = document.querySelector("#loadingModal");
  modal.classList.remove("show");
  modal.style.display = "none";
};


const checkLoggedIn = async () => {
  displayloading();
  if (localStorage.getItem("token")) {
    
    const showdata = await request_data();
    //console.log(showdata);
    render(showdata, {
      element1: "#container1",
      element2: "#container2"
    });
    
  }
  else {
    alert("未登录无法查看！")
  }
  endloading();
}

document.addEventListener("DOMContentLoaded", checkLoggedIn); //文档加载时候就加入监听
