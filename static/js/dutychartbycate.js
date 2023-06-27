
import { request_data } from "./dutychart.js";


//这段代码会让 #chart-by-cat 元素相对于父元素 #chart-by-cat-modal-body 居中显示,并且 ECharts 会填满整个 #chart-by-cat 容器,形成居中的效果。
const parent = document.getElementById("chart-by-cat-modal-body");
parent.style.display = "flex";
parent.style.alignItems = "center";  // 垂直居中
parent.style.justifyContent = "center"; // 水平居中  


const render = (showdata, opt) => {
  const el1 = document.querySelector(opt.element);
  const myChart1 = echarts.init(el1, null, {
    renderer: "canvas",
    useDirtyRect: false,
    width: "700vw",  //在初始化 ECharts 时,手动设置容器尺寸,而不依赖自动获取，不然渲染不出来
    height: "600vh",
  });

  const option1 = {
    title: {
      text: "{highlight| 右侧滑块拉伸、移动区间}",
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
  //window.addEventListener("resize", myChart1.resize);//可以在窗口大小发生变化时自动调用 ECharts 实例的 resize() 方法来重新计算尺寸并渲染图表，但这并不能解决模态框初始时图表无法显示的问题
  //myChart1.resize(); //手动调用resize()方法
}


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
    //console.log('showdata',showdata);
    render(showdata, {
      element: "#chart-by-cat",
    });

  }
  else {
    alert("未登录无法查看！")
  }
  endloading();
}

document.addEventListener("DOMContentLoaded", checkLoggedIn); //文档加载时候就加入监听
