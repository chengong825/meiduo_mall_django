let vm = new Vue({
    el: '#app',
    delimiters: ['[[', ']]'],
    data: {
        host,
        username: sessionStorage.username || localStorage.username,
        user_id: sessionStorage.user_id || localStorage.user_id,
        token: sessionStorage.token || localStorage.token,
        tab_content: {
            detail: true,
            pack: false,
            comment: false,
            service: false
        },

        sku_id: '',
        login_url:'/login.html',
        sku_count: 1,
        sku_price: price,
        cart_total_count: 0, // 购物车总数量
        cart: [], // 购物车数据
        hots: [], // 热销商品
        cat: cat, // 商品类别
        logout_url:window.location.pathname+window.location.search,
        comments: [], // 评论信息
        score_classes: {
            1: 'stars_one',
            2: 'stars_two',
            3: 'stars_three',
            4: 'stars_four',
            5: 'stars_five',
        }
    },
    computed: {
        sku_amount: function () {
            return (this.sku_price * this.sku_count).toFixed(2);
        },
        total_count: function () {
            let total = 0;
            for (let i = 0; i < this.cart.length; i++) {
                total += parseInt(this.cart[i].count);
                this.cart[i].amount = (parseFloat(this.cart[i].price) * parseFloat(this.cart[i].count)).toFixed(2);
            }
            return total;
        },

    },

    mounted: function () {
        // 添加用户浏览历史记录
        this.get_sku_id();
        if (this.user_id) {
            axios.post(this.host + '/browse_histories/', {
                sku_id: this.sku_id
            }, {
                headers: {
                    'Authorization': 'JWT ' + this.token
                }
            })
        }
        this.get_cart();
        this.get_hot_goods();
        this.get_comments();
        this.login_url='/login.html?next=/goods/'+this.sku_id+'.html';

    },
    methods: {
        // 退出
        logout: function () {
            sessionStorage.clear();
            localStorage.clear();
            location.href = this.logout_url;
        },
        // 控制页面标签页展示
        on_tab_content: function (name) {
            this.tab_content = {
                detail: false,
                pack: false,
                comment: false,
                service: false
            };
            this.tab_content[name] = true;
        },
        // 从路径中提取sku_id
        get_sku_id: function () {
            let re = /^\/goods\/(\d+).html$/;
            this.sku_id = document.location.pathname.match(re)[1];
        },
        // 减小数值
        on_minus: function () {
            if (this.sku_count > 1) {
                this.sku_count--;
            }
        },
        // 添加购物车
        add_cart: function () {
            axios.post(this.host + '/cart/', {
                sku_id: parseInt(this.sku_id),
                count: this.sku_count
            }, {
                headers: {
                    'Authorization': 'JWT ' + this.token
                },
                responseType: 'json',
                withCredentials: true
            })
                .then(response => {
                    alert('添加购物车成功');
                    this.cart_total_count += response.data.count;
                    location.reload();
                })
                .catch(error => {
                    if ('non_field_errors' in error.response.data) {
                        alert(error.response.data.non_field_errors[0]);
                    } else {
                        alert('添加购物车失败');
                    }
                    console.log(error.response.data);
                })
        },
        // 购物车全选
        on_selected_all: function () {
            let selected = !this.selected_all;
            axios.put(this.host + '/cart/selection/', {
                selected
            }, {
                responseType: 'json',
                headers: {
                    'Authorization': 'JWT ' + this.token
                },
                withCredentials: true
            })
                .then(response => {
                    for (let i = 0; i < this.cart.length; i++) {
                        this.cart[i].selected = selected;
                    }
                })
                .catch(error => {
                    console.log(error.response.data);
                })
        },
        // 获取购物车数据
        get_cart: function () {
            // 获取购物车数据
            axios.get(this.host + '/cart/', {
                headers: {
                    'Authorization': 'JWT ' + this.token
                },
                responseType: 'json',
                withCredentials: true
            })
                .then(response => {
                    this.cart = response.data;
                    for (let i = 0; i < this.cart.length; i++) {
                        this.cart[i].amount = (parseFloat(this.cart[i].price) * this.cart[i].count).toFixed(2);
                    }
                })
                .catch(error => {
                    console.log(error.response.data);
                })
        },
        // 获取热销商品数据
        get_hot_goods: function () {

        },
        // 获取商品评价信息
        get_comments: function () {

        }
    }
});