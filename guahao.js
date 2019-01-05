// ==UserScript==
// @name         guahao
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        http://www.bjguahao.gov.cn/dpt/appoint/*
// @match        http://www.bjguahao.gov.cn/order/confirm/*
// @grant        none
/**
 * Created by Anno on 2018.12.23.
 */
// ==/UserScript==

(function() {
    /**
     /**
     * Created by Anno on 2018.12.23.
     */

    var account;
    var pwd;
    var date;
    var doctorName;
    var skill;

    var hospitalID;
    var departmentID;
    var dutySourceId;
    var doctorId;
    var gotDoctorId = false;
    var error = true;
    var interval;

    function isLogin(){
        $('#mobileQuickLogin').val(account);
        $('#pwQuickLogin').val(pwd);
        $('#quick_login').click();

        submit();
    }

    function submit(){
        var yzm1 = $("#yzmQuickLogin").val();
        var userMobile = Base64.encode(account);
        var userPassword = Base64.encode(pwd);
        $.ajax({
            type : "post",
            url : "/quicklogin.htm",
            data : {
                mobileNo : userMobile,
                password : userPassword,
                yzm : yzm1,
                isAjax : true
            },
            dataType : "json",
            success : function(response) {
                error = true;
                if (!response.hasError) {
                    getDoctorList();
                } else {
                    isLogin();
                }
            }
        })
    }

    function getInfo(){
        account = $('#account').val();
        pwd = $('#pwd').val();
        date = $('#date').val();
        doctorName = $('#doctorName').val();
        skill = $('#skill').val();

        var url = location.pathname;
        var reg = /appoint\/(\d*)-(\d*)\.htm/g;
        var matchData = reg.exec(url);
        hospitalID = matchData[1];
        departmentID = matchData[2];

        interval = setInterval(function(){
            console.log('刷号中')
            getDoctorList()
        },1500);
    }

    function getDoctorList(){
        getDoctor(1);
        getDoctor(2);

        function getDoctor(code){
            $.ajax({
                url:'http://www.bjguahao.gov.cn/dpt/partduty.htm',
                type:'POST',
                contentType:'application/x-www-form-urlencoded; charset=UTF-8',
                data:{
                    isAjax:true,
                    departmentId:departmentID,
                    hospitalId:hospitalID,
                    dutyCode:code,
                    dutyDate:date,
                },
                success:filterDoctor,
            });
        }

        function filterDoctor(res){
            try{
                var data = JSON.parse(res);
                if(data.hasError){
                    if(error){
                        error = !error;
                        isLogin();
                    }
                }else{
                    data.data.forEach(function(e){
                        if(gotDoctorId){
                            return
                        }
                        if(e.remainAvailableNumber == 0){
                            if((e.doctorName == doctorName)
                                || (e.doctorTitleName == '知名专家' && e.skill.indexOf(skill) != -1)){
                                dutySourceId = e.dutySourceId;
                                doctorId = e.doctorId;
                                gotDoctorId = !gotDoctorId;
                                clearInterval(interval);
                                goNextPage()
                            }
                        }else{
                            console.log(e.doctorName+'没号了')
                        }
                    })
                }
            }catch(e){
                if(error){
                    error = !error;
                    isLogin();
                }
            }
        }
    }

    function goNextPage(){
        window.open('/order/confirm/' + hospitalID + '-'+ departmentID +'-' + doctorId +'-'+ dutySourceId +'.htm')
    }

    function clickCodeBtn(){
        var btn = $('#btnSendCodeOrder');
        if(!btn.val()){
            clickCodeBtn()
        }else{
            // btn.click();
            $('body').scrollTop($('body').scrollTop(10000).scrollTop()-130);
            inputCode();
        }
    }

    function inputCode(){
        $('#Rese_db_dl_dxyzid')
            .attr('maxlength',6)
            .on('keyup',function(){
                if($(this).val().length == 6){
                    $('#Rese_db_qryy_btn_v1').click();
                }
            })
    }

    function getRedirect(){
        var url = location.pathname;
        if(url.indexOf('confirm') != -1){
            clickCodeBtn();
        }else if(url.indexOf('appoint') != -1){
            addFrameInputBox();
        }
    }

    function cancelInterval(){
        console.log('取消了')
        clearInterval(interval);
    }

    function addFrameInputBox(){
        $('body').append(`<div style="position: fixed;right: 0;top: 0;width: 133px;z-index: 1000;border: 3px solid #ddd;background: #fff;">
            <label for="">*账号：</label><input style="background:#ddd" id="account" type="text" value="">
            <label for="">*密码：</label><input style="background:#ddd" id="pwd" type="text" value="">
            <label for="">*日期：</label><input style="background:#ddd" id="date" type="text" value="2018-12-26">
            <label for="">专家：</label><input style="background:#ddd" id="doctorName" type="text" value="王少波">
            <label for="">症状：</label><input style="background:#ddd" id="skill" type="text" value="腰椎">
            <input id='submitBtn' type="button" style="background:#4987DD" value="确定">
            <input id='resetBtn' type="button" style="background:#4987DD" value="取消">
        </div>`);
        $('#submitBtn').on('click',getInfo)
        $('#resetBtn').on('click',cancelInterval)
    }

    getRedirect();
})();

