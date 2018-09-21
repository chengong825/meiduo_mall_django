let vm = new Vue({
        el: '#app',
        data: {
            host,
            user_id: sessionStorage.user_id || localStorage.user_id,
            token: sessionStorage.token || localStorage.token,
            username: '',
            mobile: '',
            email: '',
            email_active: false,
            email_error: false,
            password: '',
            password2: '',
            old_password: '',
        },
        mounted: function () {
            // 判断用户的登录状态
            if (this.user_id && this.token) {
                axios.get(this.host + '/user/', {
                    // 向后端传递JWT token的方法
                    headers: {
                        'Authorization': 'JWT ' + this.token
                    },
                    responseType: 'json',
                })
                    .then(response => {
                        // 加载用户数据
                        this.user_id = response.data.id;
                        this.username = response.data.username;
                        this.mobile = response.data.mobile;
                        this.email = response.data.email;
                        this.email_active = response.data.email_active;
                    })
                    .catch(error => {
                        if (error.response) {
                            console.log(error.response);
                        }
                        else {
                            console.log(error)
                        }
                        location.href = '/login.html?next=/user_center_pass.html';
                    });
            } else {

                location.href = '/login.html?next=/user_center_pass.html';
            }

        },
        methods: {
            // 退出
            logout: function () {
                sessionStorage.clear();
                localStorage.clear();
                location.href = '/index.html';
            },
            modify_password: function () {
                axios.post(this.host + '/password/',
                    {
                        old_password: this.old_password,
                        password: this.password,
                        password2: this.password2,
                    },
                    {
                        headers: {
                            'Authorization': 'JWT ' + this.token
                        },
                    },
                    {
                        responseType: 'json',
                    })
                    .then(response => {

                        alert(response.data.data);
                        sessionStorage.clear();
                        localStorage.clear();
                        location.href('/login.html?next=/user_center_pass.html');
                    })
                    .catch(error => {
                        if (error.response) {
                            alert(error.response.data.error);
                            console.log(error.response);
                        }
                        else {
                            alert(error);
                            console.log(error)
                        }

                    });
            }


        }
    })
;