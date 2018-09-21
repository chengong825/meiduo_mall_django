let vm = new Vue({
    el: '#app',
    data: {
        host: host,
        error_username: false,
        error_pwd: false,
        error_pwd_message: '请填写密码',
        username: '',
        password: '',
        remember: false
    },
    methods: {
        // 获取url路径参数
        get_query_string: function (name) {
            let reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
            let r = window.location.search.substr(1).match(reg);
            console.log(window.location.search);
            console.log(r);
            if (r !== null) {
                console.log(decodeURI(r[2]));
                return decodeURI(r[2]);
            }
            return null;
        },
        // 检查数据
        check_username: function () {
            this.error_username = !this.username;
        },
        check_pwd: function () {
            if (!this.password) {
                this.error_pwd_message = '请填写密码';
                this.error_pwd = true;
            } else {
                this.error_pwd = false;
            }
        },
        // 表单提交
        on_submit: function () {
            this.check_username();
            this.check_pwd();

            if (!this.error_username && !this.error_pwd) {
                axios.post(this.host + '/authorizations/', {
                    username: this.username,
                    password: this.password
                }, {
                    responseType: 'json',
                    withCredentials: true
                })
                    .then(response => {
                        // 使用浏览器本地存储保存token
                        alert("登录成功");
                        if (this.remember) {
                            // 记住登录
                            sessionStorage.clear();
                            localStorage.token = response.data.token;
                            localStorage.user_id = response.data.user_id;
                            localStorage.username = response.data.username;
                        } else {
                            // 未记住登录
                            localStorage.clear();
                            sessionStorage.token = response.data.token;
                            sessionStorage.user_id = response.data.user_id;
                            sessionStorage.username = response.data.username;
                        }

                        // 跳转页面
                        let return_url = this.get_query_string('next');
                        if (!return_url) {
                            return_url = '/index.html';
                        }
                        console.log(return_url);
                        location.href = return_url;
                    })
                    .catch(error => {
                        if (error.response) {
                            if (error.response.status === 400) {
                                this.error_pwd_message = '用户名或密码错误';
                            } else {
                                this.error_pwd_message = '服务器错误';
                            }
                            console.log(error.response.data);
                        }
                        else {
                            console.log(error)
                        }
                        this.error_pwd = true;
                    })
            }
        },
        // qq登录
        qq_login: function () {
            let next = this.get_query_string('next') || '/';

            console.log(this.host + '/oauth/qq/authorization/?next=' + next);
            axios.get(this.host + '/oauth/qq/authorization/?next=' + next, {
                responseType: 'json'
            })
                .then(response => {
                    console.log(response.data.login_url);
                    location.href = response.data.login_url;
                })
                .catch(error => {
                    if (error.response) {
                        console.log(error.response.data);
                    }
                    else {
                        console.log(error)
                    }
                })
        }
    }
});
