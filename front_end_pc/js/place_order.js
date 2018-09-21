let vm = new Vue({
    el: '#app',
    data: {
        host,
        username: sessionStorage.username || localStorage.username,
        user_id:sessionStorage.user_id || localStorage.user_id,
        token:sessionStorage.token || localStorage.token,
        skus: [],
        freight: 0, // 运费
        total_count: 0,
        total_amount: 0,
        payment_amount: 0,
        order_submitting: false, // 正在提交订单标志
        pay_method: 1, // 支付方式,
        nowsite:0, // 默认地址
        addresses: [],
    },
    mounted: function(){
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
                    axios.get(this.host + '/addresses/', {
                        headers: {
                            'Authorization': 'JWT ' + this.token
                        },
                        responseType: 'json'
                    })
                        .then(response => {
                            this.addresses = response.data.addresses;
                            this.nowsite = response.data.default_address_id;
                        })
                        .catch(error => {
                            if (error.response) {
                                status = error.response.status;
                                if (status === 401 || status === 403) {
                                    location.href = 'login.html?next=/user_center_site.html';
                                } else {
                                    alert(error.response.data.detail);
                                }
                            }
                            else {
                                console.log(error)
                            }
                        })
                })
                .catch(error => {
                    if (error.response) {
                        console.log(error.response);
                    }
                    else {
                        console.log(error)
                    }
                    location.href = '/login.html?next=place_order.html';
                });
        } else {
            location.href = '/login.html?next=/place_order.html';
        }
        // 获取结算商品信息
        axios.get(this.host+'/orders/settlement/', {
                headers: {
                    'Authorization': 'JWT ' + this.token
                },
                responseType: 'json'
            })
            .then(response => {
                this.skus = response.data.skus;
                this.freight = response.data.freight;
                this.total_count = 0;
                this.total_amount = 0;
                for(let i=0; i<this.skus.length; i++){
                    let amount = parseFloat(this.skus[i].price)*this.skus[i].count;
                    this.skus[i].amount = amount.toFixed(2);
                    this.total_count += this.skus[i].count;
                    this.total_amount += amount;
                }
                this.payment_amount = parseFloat(this.freight) + this.total_amount;
                this.payment_amount = this.payment_amount.toFixed(2);
                this.total_amount = this.total_amount.toFixed(2);
            })
            .catch(error => {
                if (error.response.status === 401){
                    location.href = '/login.html?next=/cart.html';
                } else{
                    console.log(error);
                    console.log(error.response.data);

                }
            })
    },
    methods: {
        // 退出
        logout: function(){
            sessionStorage.clear();
            localStorage.clear();
            location.href = '/index.html';
        },
        //提交订单
        on_order_submit: function(){
            if (this.order_submitting === false){
                this.order_submitting = true;
                axios.post(this.host+'/orders/', {
                        address: this.nowsite,
                        pay_method: this.pay_method
                    }, {
                        headers: {
                            'Authorization': 'JWT ' + this.token
                        },
                        responseType: 'json'
                    })
                    .then(response => {
                        location.href = '/order_success.html?order_id='+response.data.order_id
                            +'&amount='+this.payment_amount
                            +'&pay='+this.pay_method;
                    })
                    .catch(error => {
                        this.order_submitting = false;
                        console.log(error);
                        alert(error.response.data);
                    })
            }
        }
    }
});