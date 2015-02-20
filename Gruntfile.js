module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),      
        uglify: {
            dev: {
                files: {
                    'js/pinnd.min.js': ['js/pinnd.js']
                }
            }
        },
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('default', ['uglify']);

}
