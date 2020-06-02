<template>
	<view class="content">
		<image class="logo" src="/static/logo.png"></image>
		<view>
			<text class="title">{{ title }}</text>
			<button @click="upload">上传</button>
		</view>
	</view>
</template>

<script>
import { test } from '@/common/service.js' // 局部引入
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
							console.log(res);
						})
						.catch(err => {
							console.log(err);
						});
				}
			});
		},
		/**
		 * 全局引入的方式获取数据
		 */
		globalGetData() {
			this.$http
				.post(
					'/api/flyloanmain/list',
					{ id: '111' },
					{
						params: { page: 1, pageSize: 15 },
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
					console.log(res);
				})
				.catch(err => {
					console.log(err);
				});
		},
		/**
		 * 局部引入的方式获取数据
		 */
		localGetData() {
			test
				.get('/user/list', { params: { id: '111' } })
				.then(res => {})
				.catch(err => {});
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
}

.title {
	font-size: 36upx;
	color: #8f8f94;
}
</style>
