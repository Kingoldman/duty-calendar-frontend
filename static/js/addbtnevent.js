import { urlrequest } from "./myrequest.js";
import { config } from "./config.js";


//localStorage.removeItem("token");

//值班人员
const dutyerlistBtn = document.getElementById("dutyerlist");
dutyerlistBtn.addEventListener("click", function () {
  window.open("./../../dutyerlist/dutyerlist.html", "_blank");
});


//值班统计
const analysisBtn = document.getElementById("analysis");
analysisBtn.addEventListener("click", function () {
  if (localStorage.getItem("token")) {
    //有token就放行，感觉简陋了，不想弄了
    window.dutychartWindow = window.open("./../../dutychart/dutychart.html", "_blank"); //把这个窗口放在window里
  } else {
    const modal = new bootstrap.Modal(document.getElementById("loginModal"));
    modal.show();
  }
});


//登录、退出
const loginBtn = document.getElementById("loginBtn");
// 检查登录状态
if (localStorage.getItem("token")) {
  loginBtn.textContent = "退出";
  loginBtn.setAttribute("data-status", "logged-in");
} else {
  loginBtn.textContent = "登录";
  loginBtn.setAttribute("data-status", "logged-out");
}


loginBtn.addEventListener("click", async function (event) {
  event.preventDefault(); // 异步请求,防止表单默认提交
  const status = loginBtn.getAttribute("data-status");
  if (status === "logged-in") {
    if (confirm("确定要退出吗？")) {
      const token = localStorage.getItem("token");
      if (token) {
        const authorizationheaders = { Authorization: `Bearer ${token}` };
        let response = "";
        try {
          response = await urlrequest.post(
            `${config.requesturl}/api/dutycalendar/logout`,
            {},
            authorizationheaders
          );

          if (response.code === 200) {
            localStorage.removeItem("token");
            loginBtn.textContent = "登录";
            loginBtn.setAttribute("data-status", "logged-out");
            // 退出登录后，关闭值班统计窗口
            if (window.dutychartWindow && !window.dutychartWindow.closed) {
              window.dutychartWindow.close();
            }
          } else {
            alert("退出失败");
          }
        } catch (error) {
          console.log("error:", error);
          throw error;
        }
      }
    }
  } else {
    const modal = new bootstrap.Modal(document.getElementById("loginModal"));
    modal.show();
  }
});


//字符串类型的密钥转换为 WordArray 类型；密钥长度需要符合 AES 加密算法的要求，可以是 128、192 或 256 位，如果不足需要进行填充；
const key = CryptoJS.enc.Utf8.parse('012345678123456789101213'); // 呵呵

// 提交
const submitBtn = document.getElementById("submitBtn");
submitBtn.addEventListener("click", async function (event) {
  event.preventDefault(); // 异步请求,防止表单默认提交
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;


  //检查表单是否填写完整
  if (username.trim() === '' || password.trim() === '') {
    alert('请填写账号和密码');
    return;
  }

  const encryptedpassword = CryptoJS.AES.encrypt(password, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  }).toString();

  let response = "";
  try {
    response = await urlrequest.post(
      `${config.requesturl}/api/dutycalendar/login`,
      {
        data: {
          username: username,
          password: encryptedpassword,
        },
      }
    );
    // console.log(response);
    //返回的就是jsonresponse
    if (response.code === 200) {
      const token = response.token;
      localStorage.setItem("token", token);
      alert("登录成功");
      const modal = bootstrap.Modal.getInstance(
        document.querySelector("#loginModal")
      );
      modal.hide();
      loginBtn.textContent = "退出";
      loginBtn.setAttribute("data-status", "logged-in"); //修改标识
    } else {
      alert("登录失败");
    }
  } catch (error) {
    console.log("error:", error);
    throw error;
  }
});


//请求值班人员队列安排
const everymonthdutyerqueue = async (curdate) => {
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

  let ans = [];
  if (res.length > 0) {
    ans = JSON.parse(res[0]["dutyerqueue"]);
  }
  return ans;
};


const weekdayList = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];
// 导出值班表
const exportbtn = document.getElementById("export-btn");
exportbtn.addEventListener("click", async function () {

  if (localStorage.getItem("token")) {
    //有token就放行，感觉简陋了，不想弄了
    const list = document.querySelectorAll(".calendar-left-main .calendar-main-col"); // 直接解析当前月页面数据
    const [year,month,day] =  list[6].attributes["date"].nodeValue.split('-'); //第6个是第一排最后一个，肯定有数据
    const all_duty_list = await everymonthdutyerqueue(`${year}-${month}-1`);
    if (all_duty_list.length <= 0) {
      alert(`${year}年${month}月排班未出。`);
      return;
    }

    const res = []; //存放当前月信息
    // res = [{
    //   "date": "2023-6-1",
    //   "week": "星期四",
    //   "dutyinfo": {
    //     "leader": [
    //       "领导",
    //       "0123456"
    //     ],
    //     "d-person-one": [
    //       "办公室",
    //       "498****6"
    //     ],
    //     "d-person-two": [
    //       "办公室",
    //       "498****6"
    //     ],
    //     "e-person-one": [
    //       "xxx",
    //       "xxx****xxx"
    //     ],
    //     "e-person-two": [
    //       "xxx",
    //       "xxx****xxx"
    //     ]
    //   }
    // },]
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      if (!item.classList.contains("notthisMonth")) {
        const date = item.getAttribute("date");
        const week = weekdayList[i % 7];
        const dutyInfo = {};
        const leaderName = item.querySelector(".leader-name").textContent.trim();
        const leaderTel = item.querySelector(".leader-tel").textContent.trim();
        dutyInfo["leader"] = [leaderName, leaderTel];

        const dayShiftOneName = item.querySelector(".d-person-one .name").textContent.trim();
        const dayShiftOneTel = item.querySelector(".d-person-one .tel").textContent.trim();
        dutyInfo["d-person-one"] = [dayShiftOneName, dayShiftOneTel];

        const dayShiftTwoName = item.querySelector(".d-person-two .name").textContent.trim();
        const dayShiftTwoTel = item.querySelector(".d-person-two .tel").textContent.trim();
        dutyInfo["d-person-two"] = [dayShiftTwoName, dayShiftTwoTel];

        const nightShiftOneName = item.querySelector(".e-person-one .name").textContent.trim();
        const nightShiftOneTel = item.querySelector(".e-person-one .tel").textContent.trim();
        dutyInfo["e-person-one"] = [nightShiftOneName, nightShiftOneTel];

        const nightShiftTwoName = item.querySelector(".e-person-two .name").textContent.trim();
        const nightShiftTwoTel = item.querySelector(".e-person-two .tel").textContent.trim();
        dutyInfo["e-person-two"] = [nightShiftTwoName, nightShiftTwoTel];

        res.push({
          date: date,
          week: week,
          dutyinfo: dutyInfo,
        });
      }
    }

    //使用 xlsx库导出excel表格
    const wb = XLSX.utils.book_new()
    const ymm = res[0].date.split('-')
    const title = `${ymm[0]}年${ymm[1]}月值班表（领导值班未最终确定）`

    const ws_data = [
      ["", "", "", "", "", ""],
      [{ v: title, s: { colspan: 6 } }, "", "", "", "", ""],
      ["日期", "领导", { v: "白班", s: { colspan: 2 } }, "", { v: "夜班", s: { colspan: 2 } }, ""],
    ]

    res.forEach((item) => {
      const date = item.date.replace(/-/g, '/')
      const leader = item.dutyinfo.leader[0]
      const leaderPhone = item.dutyinfo.leader[1]
      const dayOneDept = item.dutyinfo['d-person-one'][0]
      const dayOnePhone = item.dutyinfo['d-person-one'][1]
      const dayOneName = item.dutyinfo['e-person-one'][0]
      const dayOneNamePhone = item.dutyinfo['e-person-one'][1]
      const dayTwoDept = item.dutyinfo['d-person-two'][0]
      const dayTwoPhone = item.dutyinfo['d-person-two'][1]
      const dayTwoName = item.dutyinfo['e-person-two'][0]
      const dayTwoNamePhone = item.dutyinfo['e-person-two'][1]
      const week = item['week']
      const riqi = `${date}(${week})`
      ws_data.push([riqi, leader, dayOneDept, dayOnePhone, dayOneName, dayOneNamePhone])
      ws_data.push(["", leaderPhone, dayTwoDept, dayTwoPhone, dayTwoName, dayTwoNamePhone])
    })

    const ws = XLSX.utils.aoa_to_sheet(ws_data)
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1")
    XLSX.writeFile(wb, `${title}.xlsx`);



  } else {
    const modal = new bootstrap.Modal(document.getElementById("loginModal"));
    modal.show();
  }

});


