let vm = new Vue({
    el: '#app',
    data: {
        host,
        username: sessionStorage.username || localStorage.username,
        user_id: sessionStorage.user_id || localStorage.user_id,
        token: sessionStorage.token || localStorage.token,
        order_id: '',
        amount: 0,
        pay_method: '',
    },
    computed: {
        operate: function () {
            if (this.pay_method === 1) {
                return '继续购物';
            } else {
                return '去支付';
            }
        }
    },
    mounted: function () {
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
                })
                .catch(error => {
                    if (error.response) {
                        console.log(error.response);
                    }
                    else {
                        console.log(error)
                    }
                    location.href = '/login.html?next=/user_center_order.html';
                });
        } else {

            location.href = '/login.html?next=/user_center_order.html';
        }
        this.order_id = this.get_query_string('order_id');
        this.amount = this.get_query_string('amount');
        this.pay_method = this.get_query_string('pay');
    },
    methods: {
        // 退出
        logout: function () {
            sessionStorage.clear();
            localStorage.clear();
            location.href = '/index.html';
        },
        // 获取url路径参数
        get_query_string: function (name) {
            let reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
            let r = window.location.search.substr(1).match(reg);
            if (r !== null) {
                return decodeURI(r[2]);
            }
            return null;
        },
        // 去支付
        next_operate: function(){
            if (this.pay_method === 1) {
                location.href = '/index.html';
            } else {
                // 发起支付
                axios.get(this.host+'/orders/'+this.order_id+'/payment/', {
                        headers: {
                            'Authorization': 'JWT ' + this.token
                        },
                        responseType: 'json'
                    })
                    .then(response => {
                        // 跳转到支付宝支付
                        location.href = response.data.alipay_url;
                    })
                    .catch(error => {
                        console.log(error.response.data);
                    })
            }
        }
    }
});