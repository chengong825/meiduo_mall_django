let vm = new Vue({
    el: '#app',
    delimiters: ['[[', ']]'],
    data: {
        host,
        username: sessionStorage.username || localStorage.username,
        user_id: sessionStorage.user_id || localStorage.user_id,
        token: sessionStorage.token || localStorage.token,
        orders: [],
        total_selected_count: 0,
        origin_input: 0, // 用于记录手动输入前的值
        is_selected_all: true,
        logout_url: window.location.pathname + window.location.search,
        page: 1, // 当前页数
        page_size: 2, // 每页数量
        ordering: '-create_time', // 排序
        count: 0,  // 总数量
        skus: [], // 数据
        cat1: {url: '', category: {name: '', id: ''}},  // 一级类别
        cat2: {name: ''},  // 二级类别
        cat3: {name: ''},  // 三级类别,
        cart_total_count: 0, // 购物车总数量
        cart: [], // 购物车数据
        pay_method: '',
        pay_method_map: {1: '货到付款', 2: '支付宝'},
        pay_status_map: {
            1: "待支付",
            2: "待发货",
            3: "待收货",
            4: "待评价",
            5: "已完成",
            6: "已取消",
        },
        order_id: 0,

    },
    computed: {
        operate: function () {
            if (this.pay_method === 1) {
                return '继续购物';
            } else {
                return '去支付';
            }
        },
        total_page: function () {  // 总页数
            console.log(Math.ceil(this.count / this.page_size));
            return Math.ceil(this.count / this.page_size);
        },
        next: function () {  // 下一页
            if (this.page >= this.total_page) {
                return 0;
            } else {
                return this.page + 1;
            }
        },
        previous: function () {  // 上一页
            if (this.page <= 0) {
                return 0;
            } else {
                return this.page - 1;
            }
        },
        page_nums: function () {  // 页码
            // 分页页数显示计算
            // 1.如果总页数<=5
            // 2.如果当前页是前3页
            // 3.如果当前页是后3页,
            // 4.既不是前3页，也不是后3页
            let nums = [];
            if (this.total_page <= 5) {
                for (let i = 1; i <= this.total_page; i++) {
                    nums.push(i);
                }
            } else if (this.page <= 3) {
                nums = [1, 2, 3, 4, 5];
            } else if (this.total_page - this.page <= 2) {
                for (let i = this.total_page - 4; i <= this.total_page; i++) {
                    nums.push(i);
                }
                // nums.reverse();
            } else {
                for (let i = this.page - 2; i < this.page + 3; i++) {
                    nums.push(i);
                }
            }
            return nums;
        },
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
                    this.get_orders();
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

    }
    ,
    methods: {
        // 退出
        logout: function () {
            sessionStorage.clear();
            localStorage.clear();
            location.href = '/index.html';
        }
        ,

        on_page: function (num) {
            if (num !== this.page) {
                this.page = num;
                this.get_orders();
            }
        },
        // 去支付
        next_operate: function (order) {
            if (this.pay_method === 1) {
                location.href = '/index.html';
            } else {
                // 发起支付

                this.order_id = order.order_id;
                console.log(order.order_id);
                if (order.status === '待支付') {
                    axios.get(this.host + '/orders/' + this.order_id + '/payment/', {
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
                            console.log(error);
                        })
                }


            }
        },
        get_orders: function () {
            axios.get(this.host + '/orderlists/', {
                headers: {
                    'Authorization': 'JWT ' + this.token,
                },
                params: {
                    page: this.page,
                    page_size: this.page_size,

                },
                responseType: 'json',
                withCredentials: true
            })
                .then(response => {
                    this.orders = response.data.results;
                    this.count = response.data.count;
                    for (let i = 0; i < this.orders.length; i++) {

                        this.orders[i].pay_method = this.pay_method_map[this.orders[i].pay_method];
                        this.orders[i].status = this.pay_status_map[this.orders[i].status];
                        // this.orders[i].amount = (parseFloat(this.orders[i].price) * this.orders[i].count).toFixed(2);
                        for (let j = 0; j < this.orders[i].order_detail.length; j++) {
                            this.orders[i].order_detail[j].url = '/goods/' + this.orders[i].order_detail[j].sku + ".html";
                        }
                    }
                    console.log(this.orders[0]);
                })
                .catch(error => {
                    if (error.status === 401) {
                        location.href = '/login.html?next=/user_center_order.html'
                    }
                    console.log(error);
                });
        },
    },
});
