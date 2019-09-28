module.exports = {
	configureWebpack: {
		output: {
			libraryExport: 'default'
		},
		optimization: {
			splitChunks: {
				chunks: 'all',
				minSize: 20000,
				maxSize: 250000,
				cacheGroups: {
					node_vendors: {
						test: /[\\/]node_modules[\\/]/,
						chunks: "all",
						priority: 1
					}
				}
			},
		},
	},
}
