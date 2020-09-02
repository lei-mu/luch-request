<template>
	<view class="content">
		<image class="logo" src="/static/logo.jpg"></image>
		<button type="default" @click="globalGetData">调用</button>

		<view class="nav-list">
			luch-request:
			<a href="https://www.quanzhan.co/luch-request/" target="_blank">luch-request官网</a>
		</view>
		<view class="nav-list">
			我的博客：
			<a href="https://www.quanzhan.co/" target="_blank">luch的博客</a>
		</view>
		<view class="footer-text"></view>
	</view>
</template>

<script>
import { getGoodsList, getGoodsInfo } from '@/api/goods.js';
export default {
	data() {
		return {
			title: 'Hello'
		};
	},
	onLoad() {
		this.globalGetData();
	},
	methods: {
		/**
		 * 全局引入的方式获取数据
		 */
		globalGetData() {
			let id = Math.random() > 0.5 ? Date.now() : undefined;
			getGoodsInfo(
				{ id: id },
				{
					username: 'luch',
					email: Date.now() + '-------webwork.s@qq.com',
					address: Date.now() + '-------https://quanzhan.co'
				}
			)
				.then(res => {
					console.log('更新用户信息 post success----期望custom 含有custom: 66');
					console.log(res);
				})
				.catch(err => {
					console.log('更新用户信息 post fail----');
					console.log(err);
				});

			getGoodsList()
				.then(res => {
					console.log('获取用户列表 get success----');
					console.log(res);
				})
				.catch(err => {
					console.log('获取用户列表 get fail----');
					console.log(err);
				});
		}
	}
};
</script>

<style>
.content {
	text-align: center;
	height: 400upx;
}

.logo {
	height: 200upx;
	width: 200upx;
	margin-top: 200upx;
	margin-bottom: 100rpx;
}

.title {
	font-size: 36upx;
	color: #8f8f94;
}
.footer-text {
	padding-top: 30rpx;
	color: red;
	text-align: center;
}
.nav-list {
	padding-top: 15rpx;
}
</style>
