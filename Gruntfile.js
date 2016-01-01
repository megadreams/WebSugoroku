
module.exports = function (grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    connect: {
      server: {
        options: {
          port: 9000,  // 適当で可
          keepalive: true,
//          hostname: '192.168.3.4'
          hostname: 'localhost'
        }   
      }   
    }   
  }); 

  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.registerTask('default', ['connect']);
}
