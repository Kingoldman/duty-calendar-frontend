import { request_data } from "./dutychart.js";


//这段代码会让 #chart-by-cat 元素相对于父元素 #chart-by-cat-modal-body 居中显示,并且 ECharts 会填满整个 #chart-by-cat 容器,形成居中的效果。
const parent = document.getElementById("chart-by-time-modal-body");
parent.style.display = "flex";
parent.style.alignItems = "center";  // 垂直居中
parent.style.justifyContent = "center"; // 水平居中  

const render = (showdata, opt) => {
  //第二个表格
  const el2 = document.querySelector(opt.element);
  const myChart2 = echarts.init(el2, null, {
    renderer: "canvas",
    useDirtyRect: false,
    width: "700vw",  //在初始化 ECharts 时,手动设置容器尺寸,而不依赖自动获取，不然渲染不出来
    height: "600vh",
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
  //window.addEventListener("resize", myChart2.resize);
  //myChart2.resize(); //手动调用resize()方法
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
    render(showdata, {
      element: "#chart-by-time",
    });
    
  }
  else {
    alert("未登录无法查看！")
  }
  endloading();
}

document.addEventListener("DOMContentLoaded", checkLoggedIn); //文档加载时候就加入监听
