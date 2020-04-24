module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt) // npm install --save-dev load-grunt-tasks

  grunt.initConfig({
    babel: {
      options: {
        sourceMap: true,
        presets: ['@babel/preset-env']
      },
      dist: {
        files: {
          'dist/app.js': 'src/index.js'
        }
      }
    }
  })

  grunt.registerTask('default', ['babel'])
}

