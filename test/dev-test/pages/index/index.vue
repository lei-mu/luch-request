<template>
	<view class="content">
		<image class="logo" src="/static/logo.jpg"></image>
		<button type="default" @click="upload">文件上传</button>
		<button type="default" @click="globalGetData">全局调用</button>
		<button type="default" @click="localGetData">局部调用</button>
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
import { test } from '@/common/service.js'; // 局部引入
export default {
	data() {
		return {
			title: 'Hello'
		};
	},
	onLoad() {
		this.globalGetData();
		this.localGetData();
	},
	methods: {
		upload() {
			let that = this;
			uni.chooseImage({
				count: 6, //默认9
				sizeType: ['original', 'compressed'], //可以指定是原图还是压缩图，默认二者都有
				sourceType: ['album'], //从相册选择
				success: function(res) {
					console.log(res);

					that.$http
						.upload('/api/upload/img', {
							filePath: res.tempFilePaths[0],
							name: 'file'
						})
						.then(res => {
							console.log('全局http 上传 get success----');
							console.log(res);
						})
						.catch(err => {
							console.log('全局http 上传 fail----');
							console.log(err);
						});
				}
			});
		},
		/**
		 * 全局引入的方式获取数据
		 */
		globalGetData() {
			let id = Math.random() > 0.5 ? Date.now() : undefined;
			this.$http
				.post(
					'/api/user/update',
					{ id: id },
					{
						custom: { auth: true },
						params: {
							username: 'luch',
							email: Date.now() + '-------webwork.s@qq.com',
							address: Date.now() + '-------https://quanzhan.co'
						},
						header: { custom: 66 },
						getTask: (task, options) => {
							setTimeout(() => {
								task.abort();
							}, 1000);
							console.log(task);
							console.log(options);
						}
					}
				)
				.then(res => {
					console.log('全局http 更新用户信息 post success----期望header 含有custom: 66');
					console.log(res);
				})
				.catch(err => {
					console.log('全局http 更新用户信息 post fail----');
					console.log(err);
				});
		},
		/**
		 * 局部引入的方式获取数据
		 */
		localGetData() {
			let id = Math.random() > 0.5 ? Date.now() : undefined;
			// 替换用户信息
			test
				.put(
					'/api/user/message',
					{ id: id, username: 'luch', email: Date.now() + '-------webwork.s@qq.com', address: Date.now() + '-------https://quanzhan.co' },
					{ params: { a: [1, 2, 3] } }
				)
				.then(res => {
					console.log('局部test 替换用户信息 get success----');
					console.log(res);
				})
				.catch(err => {
					console.log('局部test 替换用户信息 get fail----');
					console.log(err);
				});
			// 获取用户列表
			test
				.get('/api/user/list')
				.then(res => {
					console.log('局部test 获取用户列表 get success----');
					console.log(res);
				})
				.catch(err => {
					console.log('局部test 获取用户列表 get fail----');
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
