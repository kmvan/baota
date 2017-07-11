#!/usr/bin/env python
#coding:utf-8
# +-------------------------------------------------------------------
# | 宝塔Linux面板
# +-------------------------------------------------------------------
# | Copyright (c) 2015-2016 宝塔软件(http://bt.cn) All rights reserved.
# +-------------------------------------------------------------------
# | Author: 黄文良 <2879625666@qq.com>
# +-------------------------------------------------------------------
import sys,os,public,time
reload(sys)
sys.setdefaultencoding('utf-8')
class files:
    #检查敏感目录
    def CheckDir(self,path):
        import web
        path = path.replace('//','/');
        if path[-1:] == '/':
            path = path[:-1]
        
        nDirs = ('/',
                '/*',
                '/www',
                '/root',
                '/boot',
                '/bin',
                '/etc',
                '/home',
                '/dev',
                '/sbin',
                '/var',
                '/usr', 
                '/tmp',
                '/sys',
                '/proc',
                '/media',
                '/mnt',
                '/opt',
                '/lib',
                '/srv', 
                '/selinux',
                '/www/server',
                web.ctx.session.rootPath,
                web.ctx.session.logsPath,
                web.ctx.session.setupPath)
        for dir in nDirs:
            if(dir == path):
                return False
        return True
    #上传文件
    def UploadFile(self,get):
        get.path = get.path.encode('utf-8');
        if get.path.find(':\\') != -1:
            tmp = get.path.split('\\');
            get.path = tmp[len(tmp)-1];
        try:
            if not os.path.exists(get.path): os.makedirs(get.path);
            filename = (get['path'] + get['zunfile'].filename).encode('utf-8');
            fp = open(filename,'wb');
            fp.write(get['zunfile'].file.read());
            fp.close()
            if(get.codeing != 'byte'):
                srcBody = public.readFile(filename)
                import chardet
                char=chardet.detect(srcBody)
                srcBody = srcBody.decode(char['encoding']).encode('utf-8')
                public.writeFile(filename,srcBody.encode(get.codeing));
            os.system('chown www.www ' + filename);
            public.WriteLog('文件管理','上传文件['+get['zunfile'].filename+'] 到 ['+get['path']+']成功!')        
            return public.returnMsg(True,'上传成功')
        except:
            import time
            opt = time.strftime('%Y-%m-%d_%H%M%S',time.localtime())
            tmp = get['zunfile'].filename.split('.');
            if len(tmp) < 2:
                ext = ""
            else:
                ext = "." + tmp[-1];
            filename = get['path'] + "New_uploaded_files_" + opt + ext;
            fp = open(filename.encode('utf-8'),'wb');
            fp.write(get['zunfile'].file.read());
            fp.close()
            os.system('chown www.www ' + filename);
            public.WriteLog('文件管理','上传文件['+"New_uploaded_files_" + opt + ext+'] 到 ['+get['path']+']成功!')
            return public.returnMsg(True,'上传成功')
        
    #取文件/目录列表
    def GetDir(self,get):
        get.path = get.path.encode('utf-8');
        #if get.path.find('/www/wwwroot') == -1: get.path = '/www/wwwroot';
        if not os.path.exists(get.path): get.path = '/www'
        #return get.path;
        
        import pwd 
        dirnames = []
        filenames = []
        for filename in os.listdir(get.path):
            filePath = (get.path+'/'+filename).encode('utf8')
            link = '';
            if os.path.islink(filePath): 
                filePath = os.readlink(filePath);
                link = ' -> ' + filePath;
                if not os.path.exists(filePath): filePath = get.path + '/' + filePath;
                if not os.path.exists(filePath): continue;
            
            stat = os.stat(filePath)
            accept = str(oct(stat.st_mode)[-3:])
            mtime = str(int(stat.st_mtime))
            user = ''
            try:
                user = pwd.getpwuid(stat.st_uid).pw_name
            except:
                user = str(stat.st_uid)
            size = str(stat.st_size)
            if os.path.isdir(filePath):
                dirnames.append(filename+';'+size+';'+mtime+';'+accept+';'+user+';'+link);
            else:
                filenames.append(filename+';'+size+';'+mtime+';'+accept+';'+user+';'+link);
            
        
        data = {}
        data['DIR'] = sorted(dirnames);
        data['FILES'] = sorted(filenames);
        data['PATH'] = get.path
        if hasattr(get,'disk'):
            import system
            data['DISK'] = system.system().GetDiskInfo();
        return data
    
    #创建文件
    def CreateFile(self,get):
        get.path = get.path.encode('utf-8');
        try:
            if os.path.exists(get.path):
                return public.returnMsg(False,'指定文件已存在!')
            
            path = os.path.dirname(get.path)
            if not os.path.exists(path):
                os.makedirs(path)
            open(get.path,'w+').close()
            self.SetFileAccept(get.path);
            public.WriteLog('文件管理','创建文件['+get.path+']成功!')
            return public.returnMsg(True,'文件创建成功!')
        except:
            return public.returnMsg(False,'文件创建失败,请不要使用中文名!')
    
    #创建目录
    def CreateDir(self,get):
        get.path = get.path.encode('utf-8');
        try:
            if os.path.exists(get.path):
                return public.returnMsg(False,'指定目录已存在!')
            os.makedirs(get.path)
            self.SetFileAccept(get.path);
            public.WriteLog('文件管理','创建目录['+get.path+']成功!')
            return public.returnMsg(True,'目录创建成功!')
        except:
            return public.returnMsg(False,'目录创建失败,请不要使用中文名!')
    
    
    #删除目录
    def DeleteDir(self,get) :
        get.path = get.path.encode('utf-8');
        #if get.path.find('/www/wwwroot') == -1: return public.returnMsg(False,'此为演示服务器,禁止删除此目录!');
        if not os.path.exists(get.path):
            return public.returnMsg(False,'指定目录不存在!')
        
        #检查是否敏感目录
        if not self.CheckDir(get.path):
            return public.returnMsg(False,'请不要花样作死!');
        
        try:
            #检查是否存在.user.ini
            if os.path.exists(get.path+'/.user.ini'):
                os.system("chattr -i '"+get.path+"/.user.ini'")
            if hasattr(get,'empty'):
                if not self.delete_empty(get.path): return public.returnMsg(False,'不能删除非空目录 !');
            
            if os.path.exists('data/recycle_bin.pl'):
                if self.Mv_Recycle_bin(get): return public.returnMsg(True,'已将目录移动到回收站!');
            
            import shutil
            shutil.rmtree(get.path)
            public.WriteLog('文件管理','删除目录['+get.path+']成功!')
            return public.returnMsg(True,'目录删除成功!')
        except:
            return public.returnMsg(False,'目录删除失败!')
    
    #删除 空目录 
    def delete_empty(self,path):
        get.path = get.path.encode('utf-8');
        for files in os.listdir(path):
            return False
        return True
    
    #删除文件
    def DeleteFile(self,get):
        get.path = get.path.encode('utf-8');
        #if get.path.find('/www/wwwroot') == -1: return public.returnMsg(False,'此为演示服务器,禁止删除此文件!');
        if not os.path.exists(get.path):
            return public.returnMsg(False,'指定文件不存在!')
        
        #检查是否为.user.ini
        if get.path.find('.user.ini'):
            os.system("chattr -i '"+get.path+"'")
        try:
            if os.path.exists('data/recycle_bin.pl'):
                if self.Mv_Recycle_bin(get): return public.returnMsg(True,'已将文件移动到回收站!');
            os.remove(get.path)
            public.WriteLog('文件管理','删除文件['+get.path+']成功!')
            return public.returnMsg(True,'文件删除成功!')
        except:
            return public.returnMsg(False,'文件删除失败!')
    
    #移动到回收站
    def Mv_Recycle_bin(self,get):
        rPath = '/www/Recycle_bin/'
        if not os.path.exists(rPath): os.system('mkdir -p ' + rPath);
        rFile = rPath + get.path.replace('/','_bt_') + '_t_' + str(time.time());
        try:
            import shutil
            shutil.move(get.path, rFile)
            public.WriteLog('文件管理','移动['+get.path+']到回收站成功!')
            return True;
        except:
            public.WriteLog('文件管理','移动['+get.path+']到回收站失败!')
            return False;
    
    #从回收站恢复
    def Re_Recycle_bin(self,get):
        rPath = '/www/Recycle_bin/'
        get.path = get.path.encode('utf-8');
        dFile = get.path.replace('_bt_','/').split('_t_')[0];
        get.path = rPath + get.path
        try:
            import shutil
            shutil.move(get.path, dFile)
            public.WriteLog('文件管理','从回收站恢复['+dFile+']成功!')
            return public.returnMsg(True,'恢复成功!');
        except:
            public.WriteLog('文件管理','从回收站恢复['+dFile+']失败!')
            return public.returnMsg(False,'恢复失败!');
    
    #获取回收站信息
    def Get_Recycle_bin(self,get):
        rPath = '/www/Recycle_bin/'
        if not os.path.exists(rPath): os.system('mkdir -p ' + rPath);
        data = {}
        data['dirs'] = []
        data['files'] = []
        data['status'] = os.path.exists('data/recycle_bin.pl')
        for file in os.listdir(rPath):
            tmp = {}
            fname = rPath + file
            tmp1 = file.split('_bt_')
            tmp2 = tmp1[len(tmp1)-1].split('_t_')
            tmp['rname'] = file;
            tmp['dname'] = file.replace('_bt_','/').split('_t_')[0]
            tmp['name'] = tmp2[0];
            tmp['time'] = int(float(tmp2[1]))
            tmp['size'] = os.path.getsize(fname)
            if os.path.isdir(fname):
                data['dirs'].append(tmp)
            else:
                data['files'].append(tmp)
        return data;
    
    #彻底删除
    def Del_Recycle_bin(self,get):
        rPath = '/www/Recycle_bin/'
        get.path = get.path.encode('utf-8');
        
        if not self.CheckDir(rPath + get.path):
            return public.returnMsg(False,'请不要花样作死!');
        os.system('chattr -R -i ' + rPath + get.path)
        if os.path.isdir(rPath + get.path):
            import shutil
            shutil.rmtree(rPath + get.path)
        else:
            os.remove(rPath + get.path)
        
        tfile = get.path.replace('_bt_','/').split('_t_')[0]
        public.WriteLog('文件管理','已彻底从回收站删除['+tfile+']')
        return public.returnMsg(True,'已彻底从回收站删除['+tfile+']')
    
    #清空回收站
    def Close_Recycle_bin(self,get):
        rPath = '/www/Recycle_bin/'
        os.system('chattr -R -i ' + rPath)
        os.system('rm -rf ' + rPath + '*');
        public.WriteLog('文件管理','清空回收站成功!');
        return public.returnMsg(True,'已清空回收站!');
    
    #回收站开关
    def Recycle_bin(self,get):
        c = 'data/recycle_bin.pl'
        if os.path.exists(c):
            os.remove(c)
            public.WriteLog('文件管理','关闭回收站功能成功!');
            return public.returnMsg(True,'已关闭回收站功能!');
        else:
            public.writeFile(c,'True');
            public.WriteLog('文件管理','开启回收站功能成功!');
            return public.returnMsg(True,'已开启回收站功能!');
    
    #复制文件
    def CopyFile(self,get) :
        get.sfile = get.sfile.encode('utf-8');
        get.dfile = get.dfile.encode('utf-8');
        if not os.path.exists(get.sfile):
            return public.returnMsg(False,'指定文件不存在!')
        
        if os.path.isdir(get.sfile):
            return self.CopyDir(get)
        
        import shutil
        try:
            shutil.copyfile(get.sfile, get.dfile)
            public.WriteLog('文件管理','复制文件['+get.sfile+']到['+get.dfile+']成功!')
            self.SetFileAccept(get.dfile);
            return public.returnMsg(True,'文件复制成功!')
        except:
            return public.returnMsg(False,'文件复制失败!')
    
    #复制文件夹
    def CopyDir(self,get):
        get.sfile = get.sfile.encode('utf-8');
        get.dfile = get.dfile.encode('utf-8');
        if not os.path.exists(get.sfile):
            return public.returnMsg(False,'指定目录不存在!')
        
        if not self.CheckDir(get.dfile):
            return public.returnMsg(False,'请不要花样作死!');
        
        import shutil
        try:
            shutil.copytree(get.sfile, get.dfile)
            public.WriteLog('文件管理','复制目录['+get.sfile+']到['+get.dfile+']成功!')
            self.SetFileAccept(get.dfile);
            return public.returnMsg(True,'目录复制成功!')
        except:
            return public.returnMsg(False,'目录复制失败!')
        
    
    
    #移动文件或目录
    def MvFile(self,get) :
        get.sfile = get.sfile.encode('utf-8');
        get.dfile = get.dfile.encode('utf-8');
        if not os.path.exists(get.sfile):
            return public.returnMsg(False,'指定文件或目录不存在!')
        
        if not self.CheckDir(get.sfile):
            return public.returnMsg(False,'请不要花样作死!');
        
        import shutil
        try:
            shutil.move(get.sfile, get.dfile)
            public.WriteLog('文件管理','移动文件['+get.sfile+']到['+get.dfile+']成功!')
            return public.returnMsg(True,'文件移动成功!')
        except:
            return public.returnMsg(False,'文件或目录移动失败!')
    
        
    
    
    #获取文件内容
    def GetFileBody(self,get) :
        get.path = get.path.encode('utf-8');
        if not os.path.exists(get.path):
            return public.returnMsg(False,'指定文件不存在!')
        #try:
        srcBody = public.readFile(get.path)
        
        data = {}
        if srcBody:
            import chardet
            char=chardet.detect(srcBody)
            data['encoding'] = char['encoding']
            if char['encoding'] == 'ascii':data['encoding'] = 'utf-8'
            data['data'] = srcBody.decode(char['encoding']).encode('utf-8')
        else:
            data['data'] = srcBody
            data['encoding'] = 'utf-8'
        
        data['status'] = True
        return data
        #except:
        #    return public.returnMsg(False,'文件内容获取失败,请检查是否安装chardet组件!')
    
    
    #保存文件
    def SaveFileBody(self,get):
        get.path = get.path.encode('utf-8');
        if not os.path.exists(get.path):
            if get.path.find('.htaccess') == -1:
                return public.returnMsg(False,'指定文件不存在!')
        
        try:
            isConf = get.path.find('/www/server')
            if isConf != -1:
                os.system('\\cp -a '+get.path+' /tmp/backup.conf');
            
            data = get.data[0];
            
            if get.path.find('/www/server/cron') != -1:
                    try:
                        import crontab
                        data = crontab.crontab().CheckScript(data);
                    except:
                        pass
            
            if get.encoding == 'ascii':get.encoding = 'utf-8';
            public.writeFile(get.path,data.encode(get.encoding));
            
            
            if isConf != -1:
                isError = public.checkWebConfig();
                if isError != True:
                    os.system('\\cp -a /tmp/backup.conf '+get.path);
                    return public.returnMsg(False,'配置文件错误:<br><font style="color:red;">'+isError.replace("\n",'<br>')+'</font>');
                public.serviceReload();
                
            public.WriteLog('文件管理','文件['+get.path+']保存成功!');
            return public.returnMsg(True,'文件保存成功!');
        except:
            return public.returnMsg(False,'文件保存失败!');
        
    
    #文件压缩
    def Zip(self,get) :
        get.sfile = get.sfile.encode('utf-8');
        get.dfile = get.dfile.encode('utf-8');
        get.path = get.path.encode('utf-8');
        if get.sfile.find(',') == -1:
            if not os.path.exists(get.path+'/'+get.sfile): return public.returnMsg(False,'指定文件或目录不存在');
        try:
            tmps = '/tmp/panelExec.log'
            if get.type == 'zip':
                os.system("cd '"+get.path+"' && zip '"+get.dfile+"' -r '"+get.sfile+"' > "+tmps+" 2>&1")
            else:
                #for sfile in get.sfile.split(','):
                #    if not sfile: continue;
                #    if not os.path.exists(get.dfile):
                #        os.system("cd '" + get.path + "' && tar -cvf '" + get.dfile + "' '" + sfile + "' > " + tmps + " 2>&1");
                #    else:
                #       os.system("cd '" + get.path + "' && tar -uvf '" + get.dfile + "' '" + sfile + "' > " + tmps + " 2>&1");
                
                
                sfiles = ''
                for sfile in get.sfile.split(','):
                    if not sfile: continue;
                    sfiles += " '" + sfile + "'";
                os.system("cd '" + get.path + "' && tar -zcvf '" + get.dfile + "' " + sfiles + " > " + tmps + " 2>&1");
                #return "cd '" + get.path + "' && tar -zcvf '" + get.dfile + "' " + sfiles + " > " + tmps + " 2>&1"
            self.SetFileAccept(get.dfile);
            public.WriteLog("文件管理", "压缩文件["+get.sfile+"]至["+get.dfile+"]成功!");
            return public.returnMsg(True,'文件压缩成功!')
        except:
            return public.returnMsg(False,'文件压缩失败!')
    
    
    #文件解压
    def UnZip(self,get):
        get.sfile = get.sfile.encode('utf-8');
        get.dfile = get.dfile.encode('utf-8');
        if not os.path.exists(get.sfile):
            return public.returnMsg(False,'指定文件或目录不存在');
        #try:
        if not hasattr(get,'coding'): get.coding = 'UTF-8';
        tmps = '/tmp/panelExec.log'
        if get.type == 'zip':
            os.system("export LANG=\"zh_CN." + get.coding + "\" && unzip -o '" + get.sfile + "' -d '" + get.dfile + "' > " + tmps + " 2>&1")
        else:
            os.system("tar zxf '" + get.sfile + "' -C '" + get.dfile + "' > " + tmps + " 2>&1");
        self.SetFileAccept(get.dfile);
        public.WriteLog("文件管理", "解压文件["+get.sfile+"]至[" + get.dfile + "]成功!");
        return public.returnMsg(True,'文件解压成功!');
        #except:
        #    return public.returnMsg(False,'文件解压失败!')
    
    
    #获取文件/目录 权限信息
    def GetFileAccess(self,get):
        get.filename = get.filename.encode('utf-8');
        data = {}
        try:
            import pwd
            stat = os.stat(get.filename)
            data['chmod'] = str(oct(stat.st_mode)[-3:])
            data['chown'] = pwd.getpwuid(stat.st_uid).pw_name
        except:
            data['chmod'] = 755
            data['chown'] = 'www'
        return data
    
    
    #设置文件权限和所有者
    def SetFileAccess(self,get,all = '-R'):
        get.filename = get.filename.encode('utf-8');
        try:
            if not self.CheckDir(get.filename): return public.returnMsg(False,'请不要花样作死!');
            if not os.path.exists(get.filename):
                return public.returnMsg(False,'指定文件或目录不存在!')
            os.system('chmod '+all+' '+get.access+" '"+get.filename+"'")
            os.system('chown '+all+' '+get.user+':'+get.user+" '"+get.filename+"'")
            public.WriteLog('文件管理','设置['+get.filename+']权限为['+get.access+'],所有者为['+get.user+']')
            return public.returnMsg(True,'权限设置成功!')
        except:
            return public.returnMsg(False,'权限设置失败!')

    def SetFileAccept(self,filename):
        os.system('chown -R www:www ' + filename)
        os.system('chmod -R 755 ' + filename)
    
    
    
    #取目录大小
    def GetDirSize(self,get):
        get.path = get.path.encode('utf-8');
        import web
        tmp = public.ExecShell('du -sbh '+ get.path)
        return tmp[0].split()[0]
    
    def CloseLogs(self,get):
        import web
        get.path = web.ctx.session.rootPath
        os.system('rm -f '+web.ctx.session.logsPath+'/*')
        if web.ctx.session.webserver == 'nginx':
            os.system('kill -USR1 `cat '+web.ctx.session.setupPath+'/nginx/logs/nginx.pid`');
        else:
            os.system('/etc/init.d/httpd reload');
        
        public.WriteLog('文件管理','清理网站日志成功!')
        get.path = web.ctx.session.logsPath
        return self.GetDirSize(get)
            
    #批量操作
    def SetBatchData(self,get):
        get.path = get.path.encode('utf-8');
        if get.type == '1' or get.type == '2':
            import web
            web.ctx.session.selected = get
            return public.returnMsg(True,'标记成功,请在目标目录点击粘贴所有按钮!')
        elif get.type == '3':
            for key in get.data:
                try:
                    filename = get.path+'/'+key.encode('utf-8');
                    if not self.CheckDir(filename): return public.returnMsg(False,'请不要花样作死!');
                    os.system('chmod -R '+get.access+" '"+filename+"'")
                    os.system('chown -R '+get.user+':'+get.user+" '"+filename+"'")
                except:
                    continue;
            public.WriteLog('文件管理','批量设置权限成功!')
            return public.returnMsg(True,'批量设置权限成功!')
        else:
            import shutil
            isRecyle = os.path.exists('data/recycle_bin.pl')
            path = get.path
            for key in get.data:
                try:
                    filename = path + '/'+key.encode('utf-8');
                    get.path = filename;
                    if not os.path.exists(filename): continue
                    if os.path.isdir(filename):
                        if not self.CheckDir(filename): return public.returnMsg(False,'请不要花样作死!');
                        if isRecyle:
                            self.Mv_Recycle_bin(get)
                        else:
                            shutil.rmtree(filename)
                    else:
                        if key == '.user.ini': os.system('chattr -i ' + filename);
                        if isRecyle:
                            
                            self.Mv_Recycle_bin(get)
                        else:
                            os.remove(filename)
                except:
                    continue;
                    
            public.WriteLog('文件管理','批量删除文件成功!')
            return public.returnMsg(True,'批量删除文件成功!')
    
    
    #批量粘贴
    def BatchPaste(self,get):
        import shutil,web
        i = 0;
        get.path = get.path.encode('utf-8');
        if not self.CheckDir(get.path): return public.returnMsg(False,'请不要花样作死!');
        if get.type == '1':
            for key in web.ctx.session.selected.data:
                i += 1
                try:
                    sfile = web.ctx.session.selected.path + '/' + key.encode('utf-8')
                    dfile = get.path + '/' + key.encode('utf-8')
                    if os.path.isdir(sfile):
                        shutil.copytree(sfile,dfile)
                    else:
                        shutil.copyfile(sfile,dfile)
                except:
                    continue;
            public.WriteLog('文件管理','从['+web.ctx.session.selected.path+']批量复制到['+get.path+']成功!!')
        else:
            for key in web.ctx.session.selected.data:
                try:
                    sfile = web.ctx.session.selected.path + '/' + key.encode('utf-8')
                    dfile = get.path + '/' + key.encode('utf-8')
                    shutil.move(sfile,dfile)
                    i += 1
                except:
                    continue;
            public.WriteLog('文件管理','从['+web.ctx.session.selected.path+']批量移动到['+get.path+']成功!!')
            
        errorCount = len(web.ctx.session.selected.data) - i
        del(web.ctx.session.selected)
        return public.returnMsg(True,'批量操作成功['+str(i)+'],失败['+str(errorCount)+']');
    
    #下载文件
    def DownloadFile(self,get):
        get.path = get.path.encode('utf-8');
        import db,time
        isTask = '/tmp/panelTask.pl'
        execstr = get.url +'|bt|'+get.path+'/'+get.filename
        sql = db.Sql()
        sql.table('tasks').add('name,type,status,addtime,execstr',('下载文件['+get.filename+']','download','0',time.strftime('%Y-%m-%d %H:%M:%S'),execstr))
        public.writeFile(isTask,'True')
        self.SetFileAccept(get.path+'/'+get.filename);
        public.WriteLog('文件管理','下载文件:' + get.url + ' 到 '+ get.path);
        return public.returnMsg(True,'已将下载任务添加到队列!')
    
    #添加安装任务
    def InstallSoft(self,get):
        import db,time,web
        path = web.ctx.session.setupPath + '/php'
        if not os.path.exists(path): os.system("mkdir -p " + path);
        if web.ctx.session.server_os['x'] != 'RHEL': get.type = '3'
        apacheVersion='false';
        if web.ctx.session.webserver == 'apache':
            apacheVersion = public.readFile(web.ctx.session.setupPath+'/apache/version.pl');
        public.writeFile('/var/bt_apacheVersion.pl',apacheVersion)
        public.writeFile('/var/bt_setupPath.conf',web.ctx.session.rootPath)
        isTask = '/tmp/panelTask.pl'
        execstr = "cd " + web.ctx.session.setupPath + "/panel/install && /bin/bash install_soft.sh " + get.type + " install " + get.name + " "+ get.version;
        sql = db.Sql()
        if hasattr(get,'id'):
            id = get.id;
        else:
            id = None;
        sql.table('tasks').add('id,name,type,status,addtime,execstr',(None,'安装['+get.name+'-'+get.version+']','execshell','0',time.strftime('%Y-%m-%d %H:%M:%S'),execstr))
        public.writeFile(isTask,'True')
        public.WriteLog('安装器','添加安装任务['+get.name+'-'+get.version+']成功！');
        time.sleep(0.1);
        return public.returnMsg(True,'已将安装任务添加到队列');
    
    #删除任务队列
    def RemoveTask(self,get):
        try:
            name = public.M('tasks').where('id=?',(get.id,)).getField('name');
            status = public.M('tasks').where('id=?',(get.id,)).getField('status');
            public.M('tasks').delete(get.id);
            if status == '-1':
                os.system("kill `ps -ef |grep 'python panelSafe.pyc'|grep -v grep|grep -v panelExec|awk '{print $2}'`");
                os.system("kill `ps -ef |grep 'install_soft.sh'|grep -v grep|grep -v panelExec|awk '{print $2}'`");
                os.system("kill `ps aux | grep 'python task.pyc$'|awk '{print $2}'`");
                os.system('''
pids=`ps aux | grep 'sh'|grep -v grep|grep install|awk '{print $2}'`
arr=($pids)

for p in ${arr[@]}
do
    kill -9 $p
done
            ''');
            
                os.system('rm -f ' + name.replace('扫描目录[','').replace(']','') + '/scan.pl');
                isTask = '/tmp/panelTask.pl';
                public.writeFile(isTask,'True');
                os.system('/etc/init.d/bt start');
        except:
            os.system('/etc/init.d/bt start');
        return public.returnMsg(True,'任务已删除!');
    
    #重新激活任务
    def ActionTask(self,get):
        isTask = '/tmp/panelTask.pl'
        public.writeFile(isTask,'True');
        return public.returnMsg(True,'任务队列已激活!');
        
    
    #卸载软件
    def UninstallSoft(self,get):
        import web
        public.writeFile('/var/bt_setupPath.conf',web.ctx.session.rootPath)
        get.type = '0'
        if web.ctx.session.server_os['x'] != 'RHEL': get.type = '3'
        execstr = "cd " + web.ctx.session.setupPath + "/panel/install && /bin/bash install_soft.sh "+get.type+" uninstall " + get.name.lower() + " "+ get.version.replace('.','');
        os.system(execstr);
        public.WriteLog('安装器','卸载软件['+get.name+'-'+get.version+']成功！');
        return public.returnMsg(True,"卸载成功!");
        
    
    #取任务队列进度
    def GetTaskSpeed(self,get):
        tempFile = '/tmp/panelExec.log'
        freshFile = '/tmp/panelFresh'
        if not os.path.exists(tempFile):
            return public.returnMsg(False,'当前没有任务队列在执行-1!')
        import db
        find = db.Sql().table('tasks').where('status=?',('-1',)).field('id,type,name,execstr').find()
        if not len(find): return public.returnMsg(False,'当前没有任务队列在执行-2!')
        echoMsg = {}
        echoMsg['name'] = find['name']
        echoMsg['execstr'] = find['execstr']
        if find['type'] == 'download':
            import json
            try:
                tmp = public.readFile(tempFile)
                if len(tmp) < 10:
                    return public.returnMsg(False,'当前没有任务队列在执行-3!')
                echoMsg['msg'] = json.loads(tmp)
                echoMsg['isDownload'] = True
            except:
                db.Sql().table('tasks').where("id=?",(find['id'],)).save('status',('0',))
                return public.returnMsg(False,'当前没有任务队列在执行-4!')
        else:
            echoMsg['msg'] = self.GetLastLine(tempFile,20)
            echoMsg['isDownload'] = False
        
        echoMsg['task'] = public.M('tasks').where("status!=?",('1',)).field('id,status,name,type').order("id asc").select()
        return echoMsg
                 
    #读文件指定倒数行数
    def GetLastLine(self,inputfile,lineNum):
        try:
            fp = open(inputfile, 'r')
            lastLine = ""
            
            lines =  fp.readlines()
            count = len(lines)
            if count>lineNum:
                num=lineNum
            else:
                num=count
            i=1;
            lastre = []
            for i in range(1,(num+1)):
                if lines :
                    n = -i
                    lastLine = lines[n].strip()
                    fp.close()
                    lastre.append(lastLine)
            
            result = ''
            lineNum -= 1
            while lineNum > 0:
                result += lastre[lineNum]+"\n"
                lineNum -= 1
                
            return result
        except:
            return "等待执行..."

