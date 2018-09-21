let vm = new Vue({
    el: '#app',
    data: {
        host: host,
        is_show_waiting: true,

        error_password: false,
        error_phone: false,
        error_image_code: false,
        error_sms_code: false,
        error_image_code_message: '',
        error_phone_message: '',
        error_sms_code_message: '',

        image_code_id: '', // 图片验证码id
        image_code_url: '',

        sms_code_tip: '获取短信验证码',
        sending_flag: false, // 正在发送短信标志

        password: '',
        mobile: '',
        image_code: '',
        sms_code: '',
        access_token_md: ''
    },
    mounted: function () {
        // 从路径中获取qq重定向返回的code
        let code = this.get_query_string('code');
        axios.get(this.host + '/oauth/qq/user/?code=' + code, {
            responseType: 'json',
        })
            .then(response => {
                if (response.data.user_id) {
                    // 用户已绑定
                    sessionStorage.clear();
                    localStorage.clear();
                    localStorage.user_id = response.data.user_id;
                    localStorage.username = response.data.username;
                    localStorage.token = response.data.token;
                    let state = this.get_query_string('state');
                    console.log(this.get_query_string('state'));
                    console.log(decodeURIComponent('https://graph.qq.com/oauth2.0/show?which=Login&display=pc&response_type=code&client_id=101474184&redirect_uri=http%3A%2F%2Fwww.meiduo.site%3A8080%2Foauth_callback.html&state=%2Fsearch.html%3Fq%3D&scope=get_user_info'));
                    console.log(decodeURIComponent(window.location.search));
                    location.href = decodeURIComponent(state);

                } else {
                    // 用户未绑定
                    this.access_token_md = response.data.access_token_md;
                    this.generate_image_code();
                    this.is_show_waiting = false;
                }
            })
            .catch(error => {
                if (error.response) {
                    console.log(error.response.data);
                }
                else {
                    console.log(error);
                }

                alert('服务器异常');
            })
    },
    methods: {
        // 获取url路径参数
        get_query_string: function (name) {
            let reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
            let r = window.location.search.substr(1).match(reg);
            if (r !== null) {
                return decodeURI(r[2]);
            }
            return null;
        },
        // 生成uuid
        generate_uuid: function () {
            let d = new Date().getTime();
            if (window.performance && typeof window.performance.now === "function") {
                d += performance.now(); //use high-precision timer if available
            }
            let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                let r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
            return uuid;
        },
        // 生成一个图片验证码的编号，并设置页面中图片验证码img标签的src属性
        generate_image_code: function () {
            // 生成一个编号
            // 严格一点的使用uuid保证编号唯一， 不是很严谨的情况下，也可以使用时间戳
            this.image_code_id = this.generate_uuid();

            // 设置页面中图片验证码img标签的src属性
            this.image_code_url = this.host + "/image_codes/" + this.image_code_id + "/";
        },
        check_pwd: function () {
            let len = this.password.length;
            this.error_password = len < 8 || len > 20;
        },
        check_phone: function () {
            let re = /^1[345789]\d{9}$/;
            if (re.test(this.mobile)) {
                this.error_phone = false;
            } else {
                this.error_phone_message = '您输入的手机号格式不正确';
                this.error_phone = true;
            }
        },
        check_image_code: function () {
            if (!this.image_code) {
                this.error_image_code_message = '请填写图片验证码';
                this.error_image_code = true;
            } else {
                this.error_image_code = false;
            }
        },
        check_sms_code: function () {
            if (!this.sms_code) {
                this.error_sms_code_message = '请填写短信验证码';
                this.error_sms_code = true;
            } else {
                this.error_sms_code = false;
            }
        },
        // 发送手机短信验证码
        send_sms_code: function () {
            if (this.sending_flag === true) {
                return;
            }
            this.sending_flag = true;

            // 校验参数，保证输入框有数据填写
            this.check_phone();
            this.check_image_code();

            if (this.error_phone === true || this.error_image_code === true) {
                this.sending_flag = false;
                return;
            }

            // 向后端接口发送请求，让后端发送短信验证码
            axios.get(this.host + '/sms_codes/' + this.mobile + '/?text=' + this.image_code + '&image_code_id=' + this.image_code_id, {
                responseType: 'json'
            })
                .then(response => {
                    // 表示后端发送短信成功
                    // 倒计时60秒，60秒后允许用户再次点击发送短信验证码的按钮
                    console.log(response);
                    let num = 60;
                    // 设置一个计时器
                    let t = setInterval(() => {
                        if (num === 1) {
                            // 如果计时器到最后, 清除计时器对象
                            clearInterval(t);
                            // 将点击获取验证码的按钮展示的文本回复成原始文本
                            this.sms_code_tip = '获取短信验证码';
                            // 将点击按钮的onclick事件函数恢复回去
                            this.sending_flag = false;
                            this.generate_image_code();
                        } else {
                            num -= 1;
                            // 展示倒计时信息
                            this.sms_code_tip = num + '秒后可重新获取';
                        }
                    }, 1000, 60)
                })
                .catch(error => {
                    console.log(error);
                    console.log(error.response);
                    if (error.response) {
                        if (error.response.status === 400) {
                            this.error_image_code_message = '图片验证码有误';
                            this.error_image_code = true;
                            this.generate_image_code();
                        } else {
                            console.log(error.response.data);
                        }

                    }
                    else {
                        console.log("response is empty");
                        this.sending_flag = false;
                    }
                    this.sending_flag = false;
                })
        },
        // 保存
        on_submit: function () {
            this.check_pwd();
            this.check_phone();
            this.check_sms_code();

            if (!this.error_password && !this.error_phone && !this.error_sms_code) {
                axios.post(this.host + '/oauth/qq/user/', {
                    password: this.password,
                    mobile: this.mobile,
                    sms_code: this.sms_code,
                    access_token_md: this.access_token_md
                }, {
                    responseType: 'json',
                })
                    .then(response => {
                        alert("登录成功");
                        // 记录用户登录状态
                        sessionStorage.clear();
                        localStorage.clear();
                        localStorage.token = response.data.token;
                        localStorage.user_id = response.data.user_id;
                        localStorage.username = response.data.username;
                        location.href =
                            decodeURIComponent(this.get_query_string('state'));
                    })
                    .catch(error => {
                        if (error.response) {
                            if (error.response.status === 400) {

                                this.error_sms_code_message = error.response.data.message;
                                this.error_sms_code = true;
                            }
                            console.log(error.response.data);
                        } else {
                            console.log(error);

                        }
                    })
            }
        }
    }
});
// let vm = new Vue({
//     el: '#app',
//     data: {
//         host,
//         error_name: false,
//         error_password: false,
//         error_check_password: false,
//         error_phone: false,
//         error_allow: false,
//         error_image_code: false,
//         error_sms_code: false,
//         error_name_message: '',
//         error_image_code_message: '',
//         error_phone_message: '',
//         error_sms_code_message: '',
//
//         image_code_id: '', // 图片验证码id
//         image_code_url: '',
//
//         sms_code_tip: '获取短信验证码',
//         sending_flag: false, // 正在发送短信标志
//
//         username: '',
//         password: '',
//         password2: '',
//         mobile: '',
//         image_code: '',
//         sms_code: '',
//         allow: false
//     },
//     mounted: function () {
//         this.generate_image_code();
//     },
//
//     methods: {
//         check_username: function () {
//             let len = this.username.length;
//             if (len < 5 || len > 20) {
//                 this.error_name_message = '请输入5-20个字符的用户名';
//                 this.error_name = true;
//             } else {
//                 this.error_name = false;
//             }
//             // 检查重名
//             if (this.error_name === false) {
//                 axios.get(this.host + '/usernames/' + this.username + '/count/', {
//                     responseType: 'json'
//                 })
//                     .then(response => {
//                         if (response.data.count > 0) {
//                             this.error_name_message = '用户名已存在';
//                             this.error_name = true;
//                         } else {
//                             this.error_name = false;
//                         }
//                     })
//                     .catch(error => {
//                         if (error.response) {
//                             console.log(error.response.data);
//                         }
//
//                     })
//             }
//         },
//         check_pwd: function () {
//             let len = this.password.length;
//             this.error_password = len < 8 || len > 20;
//         },
//         check_cpwd: function () {
//             this.error_check_password = this.password !== this.password2;
//         },
//         check_phone: function () {
//             let re = /^1[345789]\d{9}$/;
//             if (re.test(this.mobile)) {
//                 this.error_phone = false;
//             } else {
//                 this.error_phone_message = '您输入的手机号格式不正确';
//                 this.error_phone = true;
//             }
//             if (this.error_phone === false) {
//                 axios.get(this.host + '/mobiles/' + this.mobile + '/count/', {
//                     responseType: 'json'
//                 })
//                     .then(response => {
//                         if (response.data.count > 0) {
//                             this.error_phone_message = '手机号已存在';
//                             this.error_phone = true;
//                         } else {
//                             this.error_phone = false;
//                         }
//                     })
//                     .catch(error => {
//                         if (error.response) {
//                             console.log(error.response.data);
//                         }
//
//                     })
//             }
//         },
//         check_image_code: function () {
//             this.error_image_code = !this.image_code;
//         },
//         check_sms_code: function () {
//             this.error_sms_code = !this.sms_code;
//         },
//         check_allow: function () {
//             this.error_allow = !this.allow;
//         },
//         // 注册
//         on_submit: function () {
//             this.check_username();
//             this.check_pwd();
//             this.check_cpwd();
//             this.check_phone();
//             this.check_sms_code();
//             this.check_allow();
//
//             if (!this.error_name && !this.error_password && !this.error_check_password
//                 && !this.error_phone && !this.error_sms_code && !this.error_allow) {
//                 axios.post(this.host + '/users/', {
//                     username: this.username,
//                     password: this.password,
//                     password2: this.password2,
//                     mobile: this.mobile,
//                     sms_code: this.sms_code,
//                     allow: this.allow.toString()
//                 }, {
//                     responseType: 'json'
//                 })
//                     .then(response => {
//                         // 记录用户的登录状态
//                         sessionStorage.clear();
//                         localStorage.clear();
//                         localStorage.token = response.data.token;
//                         localStorage.username = response.data.username;
//                         localStorage.user_id = response.data.user_id;
//                         location.href = '/index.html';
//                     })
//                     .catch(error => {
//                         if (error.response) {
//                             if (error.response.status === 400) {
//                                 if ('non_field_errors' in error.response.data) {
//                                     this.error_sms_code_message = error.response.data.non_field_errors[0];
//                                 } else {
//                                     this.error_sms_code_message = '数据有误';
//                                 }
//                                 this.error_sms_code = true;
//                             } else {
//                                 console.log(error.response.data);
//                             }
//                         }
//                         else {
//                             console.log(error);
//                         }
//
//                     })
//             }
//         },
//         // 生成uuid
//         generate_uuid: function () {
//             let d = new Date().getTime();
//             if (window.performance && typeof window.performance.now === "function") {
//                 d += performance.now(); //use high-precision timer if available
//             }
//             let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
//                 let r = (d + Math.random() * 16) % 16 | 0;
//                 d = Math.floor(d / 16);
//                 return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
//             });
//             return uuid;
//         },
//         // 生成一个图片验证码的编号，并设置页面中图片验证码img标签的src属性
//         generate_image_code: function () {
//             // 生成一个编号
//             // 严格一点的使用uuid保证编号唯一， 不是很严谨的情况下，也可以使用时间戳
//             this.image_code_id = this.generate_uuid();
//
//             // 设置页面中图片验证码img标签的src属性
//             this.image_code_url = this.host + "/image_codes/" + this.image_code_id + "/";
//         },
//         // 发送手机短信验证码
//         send_sms_code: function () {
//             if (this.sending_flag === true) {
//                 return;
//             }
//             this.sending_flag = true;
//
//             // 校验参数，保证输入框有数据填写
//             this.check_phone();
//             this.check_image_code();
//
//             if (this.error_phone === true || this.error_image_code === true) {
//                 this.sending_flag = false;
//                 return;
//             }
//
//             // 向后端接口发送请求，让后端发送短信验证码
//             axios.get(this.host + '/sms_codes/' + this.mobile + '/?text=' + this.image_code + '&image_code_id=' + this.image_code_id, {
//                 responseType: 'json'
//             })
//                 .then(response => {
//                     // 表示后端发送短信成功
//                     // 倒计时60秒，60秒后允许用户再次点击发送短信验证码的按钮
//                     console.log(response);
//                     let num = 60;
//                     // 设置一个计时器
//                     let t = setInterval(() => {
//                         if (num === 1) {
//                             // 如果计时器到最后, 清除计时器对象
//                             clearInterval(t);
//                             // 将点击获取验证码的按钮展示的文本回复成原始文本
//                             this.sms_code_tip = '获取短信验证码';
//                             // 将点击按钮的onclick事件函数恢复回去
//                             this.sending_flag = false;
//                             this.generate_image_code();
//                         } else {
//                             num -= 1;
//                             // 展示倒计时信息
//                             this.sms_code_tip = num + '秒后可重新获取';
//                         }
//                     }, 1000, 60)
//                 })
//                 .catch(error => {
//                     console.log(error);
//                     console.log(error.response);
//                     if (error.response) {
//                         if (error.response.status === 400) {
//                             this.error_image_code_message = '图片验证码有误';
//                             this.error_image_code = true;
//                             this.generate_image_code();
//                         } else {
//                             console.log(error.response.data);
//                         }
//
//                     }
//                     else {
//                         console.log("response is empty");
//                         this.sending_flag = false;
//                     }
//                     this.sending_flag = false;
//                 })
//         },
//
//     }
// });
