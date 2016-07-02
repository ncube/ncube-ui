module.exports = function (grunt) {
    'use strict';

    // Force use of Unix newlines
    grunt.util.linefeed = '\n';

    RegExp.quote = function (string) {
        return string.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');
    };

    var autoprefixerSettings = require('./grunt/autoprefixer-settings.js');
    var autoprefixer = require('autoprefixer')(autoprefixerSettings);

    var fs = require('fs');
    var path = require('path');
    var glob = require('glob');

    var generateCommonJSModule = require('./grunt/bs-commonjs-generator.js');



    // Project configuration.
    grunt.initConfig({

        // Metadata.
        pkg: grunt.file.readJSON('package.json'),
        banner: '/*!\n' +
        ' * NCube UI v<%= pkg.version %> (<%= pkg.homepage %>)\n' +
        ' * Copyright 2015-<%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
        ' * Licensed under CC-BY-SA-4.0 (https://github.com/ncube/ncube-ui/blob/master/LICENSE)\n' +
        ' */\n',
        jqueryCheck: 'if (typeof jQuery === \'undefined\') {\n' +
        '  throw new Error(\'NCube UI\\\'s JavaScript requires jQuery\')\n' +
        '}\n',
        jqueryVersionCheck: '+function ($) {\n' +
        '  var version = $.fn.jquery.split(\' \')[0].split(\'.\')\n' +
        '  if ((version[0] < 2 && version[1] < 9) || (version[0] == 1 && version[1] == 9 && version[2] < 1) || (version[0] >= 3)) {\n' +
        '    throw new Error(\'NCube UI\\\'s JavaScript requires at least jQuery v1.9.1 but less than v3.0.0\')\n' +
        '  }\n' +
        '}(jQuery);\n\n',

        // Task configuration.
        clean: {
            dist: 'dist'
        },

        // JS build configuration
        lineremover: {
            es6Import: {
                files: {
                    '<%= concat.main.dest %>': '<%= concat.main.dest %>'
                },
                options: {
                    exclusionPattern: /^(import|export)/g
                }
            }
        },

        babel: {
            dev: {
                options: {
                    sourceMap: true,
                    modules: 'ignore'
                },
                files: {
                    'js/dist/util.js': 'js/src/util.js',
                    'js/dist/alert.js': 'js/src/alert.js',
                    'js/dist/button.js': 'js/src/button.js',
                    'js/dist/carousel.js': 'js/src/carousel.js',
                    'js/dist/collapse.js': 'js/src/collapse.js',
                    'js/dist/dropdown.js': 'js/src/dropdown.js',
                    'js/dist/modal.js': 'js/src/modal.js',
                    'js/dist/scrollspy.js': 'js/src/scrollspy.js',
                    'js/dist/tab.js': 'js/src/tab.js',
                    'js/dist/tooltip.js': 'js/src/tooltip.js',
                    'js/dist/popover.js': 'js/src/popover.js'
                }
            },
            dist: {
                options: {
                    modules: 'ignore'
                },
                files: {
                    '<%= concat.main.dest %>': '<%= concat.main.dest %>'
                }
            },
            umd: {
                options: {
                    modules: 'umd'
                },
                files: {
                    'dist/js/umd/util.js': 'js/src/util.js',
                    'dist/js/umd/alert.js': 'js/src/alert.js',
                    'dist/js/umd/button.js': 'js/src/button.js',
                    'dist/js/umd/carousel.js': 'js/src/carousel.js',
                    'dist/js/umd/collapse.js': 'js/src/collapse.js',
                    'dist/js/umd/dropdown.js': 'js/src/dropdown.js',
                    'dist/js/umd/modal.js': 'js/src/modal.js',
                    'dist/js/umd/scrollspy.js': 'js/src/scrollspy.js',
                    'dist/js/umd/tab.js': 'js/src/tab.js',
                    'dist/js/umd/tooltip.js': 'js/src/tooltip.js',
                    'dist/js/umd/popover.js': 'js/src/popover.js'
                }
            }
        },

        eslint: {
            options: {
                configFile: 'js/.eslintrc'
            },
            target: 'js/src/*.js'
        },

        stamp: {
            options: {
                banner: '<%= banner %>\n<%= jqueryCheck %>\n<%= jqueryVersionCheck %>\n+function ($) {\n',
                footer: '\n}(jQuery);'
            },
            main: {
                files: {
                    src: '<%= concat.main.dest %>'
                }
            }
        },

        concat: {
            options: {
                stripBanners: false
            },
            main: {
                src: [
                    'js/src/util.js',
                    'js/src/alert.js',
                    'js/src/button.js',
                    'js/src/carousel.js',
                    'js/src/collapse.js',
                    'js/src/dropdown.js',
                    'js/src/modal.js',
                    'js/src/scrollspy.js',
                    'js/src/tab.js',
                    'js/src/tooltip.js',
                    'js/src/popover.js'
                ],
                dest: 'dist/js/<%= pkg.name %>.js'
            }
        },

        uglify: {
            options: {
                compress: {
                    warnings: false
                },
                mangle: true,
                preserveComments: /^!|@preserve|@license|@cc_on/i
            },
            core: {
                src: '<%= concat.main.dest %>',
                dest: 'dist/js/<%= pkg.name %>.min.js'
            }
        },

        qunit: {
            options: {
                inject: 'js/tests/unit/phantom.js'
            },
            files: 'js/tests/index.html'
        },

        // CSS build configuration
        postcss: {
            core: {
                options: {
                    map: true,
                    processors: [
                        // mq4HoverShim.postprocessorFor({ hoverSelectorPrefix: '.bs-true-hover ' }),
                        autoprefixer
                    ]
                },
                src: 'dist/css/*.css'
            }
        },

        csscomb: {
            options: {
                config: 'sass/.csscomb.json'
            },
            dist: {
                expand: true,
                cwd: 'dist/css/',
                src: ['*.css', '!*.min.css'],
                dest: 'dist/css/'
            }
        },

        copy: {
            baseFonts: {
                expand: true,
                src: 'fonts/**',
                dest: 'dist/'
            },
            css: {
              expand: true,
              src: 'css/**',
              dest: 'dist/'
            }
        },

        watch: {
            src: {
                files: '<%= jscs.core.src %>',
                tasks: ['babel:dev']
            },
            sass: {
                files: 'sass/**/*.sass',
                tasks: ['dist-css']
            }
        },

        //Sass Configuration
        sass: {
            options: {
                sourceMap: true,
                outputStyle: 'compressed'
            },
            dist: {
                files: {
                    'dist/css/<%= pkg.name %>.css': 'sass/main.sass'
                }
            },
            dist_min: {
                files: {
                    'dist/css/<%= pkg.name %>.min.css': 'sass/main.sass'
                }
            }
        }

    });


    // These plugins provide necessary tasks.
    require('load-grunt-tasks')(grunt, {
        scope: 'devDependencies',
        // Exclude Sass compilers. We choose the one to load later on.
        // pattern: ['grunt-*', '!grunt-sass', '!grunt-contrib-sass']
    });
    require('time-grunt')(grunt);

    // Test task.

    //   grunt.registerTask('test', testSubtasks);
    //   grunt.registerTask('test-js', ['eslint', 'qunit']);

    // JS distribution task.
    grunt.registerTask('dist-js', ['babel:dev', 'concat', 'lineremover', 'babel:dist', 'stamp', 'uglify:core', 'commonjs']);

    // CSS distribution task.
    grunt.registerTask('sass-compile', ['sass']);

    grunt.registerTask('dist-css', ['sass-compile', 'postcss:core', 'csscomb:dist']);

    // Full distribution task.
    grunt.registerTask('dist', ['clean:dist', 'dist-css', 'copy', 'dist-js']);

    // Default task.
    //   grunt.registerTask('default', ['clean:dist', 'test']);

    grunt.registerTask('commonjs', ['babel:umd', 'npm-js']);

    grunt.registerTask('npm-js', 'Generate npm-js entrypoint module in dist dir.', function () {
        var srcFiles = Object.keys(grunt.config.get('babel.umd.files')).map(function (filename) {
            return './' + path.join('umd', path.basename(filename))
        })
        var destFilepath = 'dist/js/npm.js';
        generateCommonJSModule(grunt, srcFiles, destFilepath);
    });

};
