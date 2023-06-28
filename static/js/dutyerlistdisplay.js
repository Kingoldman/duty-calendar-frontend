//dutyerlistdisplay.js

import { urlrequest } from "./myrequest.js";
import { config } from "./config.js";


const typeMap = {
  A: "全班",
  D: "只值白班",
  E: "只值夜班",
};

const genderMap = {
  M: "男",
  F: "女"
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


//请求当月人员
const everymonthdutyerqueue = async () => {
  let res;
  try {
    res = await urlrequest.get(
      `${config.requesturl}/api/dutycalendar/everymonthdutyerqueue`,
      {}
    );


  } catch (error) {
    console.log("error", error);
    throw error;
  }

  let ans = [];
  if (res.length > 0) {
    ans = res.map(({ date, dutyerqueue }) => ({
      date: parseInt(date.split('-').join('')),
      dutyerqueue: JSON.parse(dutyerqueue)
        .map(({ name, gender, duty_type }) => ({
          name,
          gender: genderMap[gender] || gender,
          duty_type: typeMap[duty_type] || duty_type,
        }))
        .filter(({ duty_type }) => duty_type !== "N"),
    }));
  }
  return ans;
};



export const dutyerlist_modal_func = async() => {
  displayloading();

  const all_duty_queue = await everymonthdutyerqueue();

  all_duty_queue.sort((a, b) => b.date - a.date); //按照时间最近来

  const container = document.getElementsByClassName("dutyerlistcontainer")[0];

  let domcontent = "";
  let navLinkscontent = "";
  for (let i = 0; i < all_duty_queue.length; i++) {
    let everymonth_start = `<div class="duty-list">`;
    const date = all_duty_queue[i]["date"];
    let head = `<div class="duty-list-time">
                      <p class = "p-head" id= "date-${date}">日期：${Math.floor(date / 100)}</p>
                  </div>`;
    let tmp_start = `<div class="duty-list-content">
      <table class="table table-striped table-hover">`;
    let table_head = `<thead>
                          <tr>
                          <th scope="col">#</th>
                          <th scope="col">姓名</th>
                          <th scope="col">性别</th>
                          <th scope="col">值班类型</th>
                          </tr>
                      </thead>`;
    let tboday_start = `<tbody>`;

    let tr_content = "";
    for (let j = 0; j < all_duty_queue[i]["dutyerqueue"].length; j++) {
      tr_content += `<tr>
              <th scope="row">${j + 1}</th>
              <td >${all_duty_queue[i]["dutyerqueue"][j]["name"]}</td>
              <td>${all_duty_queue[i]["dutyerqueue"][j]["gender"]}</td>
              <td>${all_duty_queue[i]["dutyerqueue"][j]["duty_type"]}</td>
              </tr>`;
    }
    let tboday_end = `</tbody>`;
    let tmp_end = `</table></div>`;
    let everymonth_end = `</div>`;

    domcontent +=
      everymonth_start +
      head +
      tmp_start +
      table_head +
      tboday_start +
      tr_content +
      tboday_end +
      tmp_end +
      everymonth_end;

    // 生成导航栏链接
    navLinkscontent += `<li class="nav-item">
    <a class="nav-link" href="#date-${date}">${Math.floor(date / 100)}</a>
  </li>`;
  }

  container.innerHTML = domcontent;

  endloading();



  document.querySelector('.fixed-right ul').innerHTML = navLinkscontent; //导航栏链接添加到页面中

  // 给导航栏链接绑定点击事件，点击后滚动到对应的内容位置
  const navLinks = document.querySelectorAll('.nav-link');
  for (let i = 0; i < navLinks.length; i++) {
    navLinks[i].addEventListener('click', function (event) {
      event.preventDefault();
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      targetElement.scrollIntoView({ behavior: 'smooth' });
    });
  }

}





