from fabric.api import *
import os,shutil

# globals
env.project_name = 'corewarjs'
env.export_dir = os.path.join(os.path.dirname(__file__))

# environments
def localdev():
    "Use the local virtual server"
    env.hosts = ['localhost']
    env.path = "/Users/sylvinus/w/joshfire/staticexports/myskreenv2"
    env.user = 'sylvinus'
    
    print env

def joshfire():
    "Use typhon mikiane"
    env.hosts = ['joshfire.com']
    env.path = '/home/mikiane/corewarjs'
    env.user = 'mikiane'

    
def setup():

    run('mkdir -p %s' % (env.path))
    run('cd %s; mkdir -p releases; mkdir -p shared; mkdir -p packages;' % (env.path))
    deploy()
    

def restart():
    "Restart the web server"

    if env.upstart:
        run('sudo /sbin/start node-'+env.project_name)

    
def deploy():
    """
    Deploy the latest version of the site to the servers, install any
    required third party modules, install the virtual host and 
    then restart the webserver
    """
    require('hosts', provided_by=[local])
    require('path')
    import time
    env.release = time.strftime('%Y%m%d%H%M%S')
    
    upload_tar_from_export()
    symlink_current_release()
    
    restart_webserver()
    
# Helpers. These are called by other functions rather than directly
def upload_tar_from_export():
    require('release', provided_by=[deploy, setup])
    require('path')
    
    os.system('cd %s && tar zcvf %s.tar.gz *' % (env.export_dir,env.release))
    run('mkdir %s/releases/%s' % (env.path,env.release))
    put('%s/%s.tar.gz' % (env.export_dir,env.release), '%s/packages/' % env.path)
    run('cd %s/releases/%s && tar zxf ../../packages/%s.tar.gz' % (env.path,env.release,env.release))
    os.system('rm %s/packages/%s.tar.gz' % (env.path,env.release))
    

def symlink_current_release():
    "Symlink our current release"
    require('release', provided_by=[deploy, setup])
    run('cd %s; rm -f releases/previous; touch releases/current; mv releases/current releases/previous;' % (env.path))
    run('cd %s; ln -s %s releases/current' % (env.path,env.release))
    
    
def restart_webserver():
    "Restart the web server"
    
    if env.upstart:
        run('sudo /sbin/restart node-'+env.project_name)
