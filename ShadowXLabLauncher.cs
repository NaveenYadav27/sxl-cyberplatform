using System;
using System.Diagnostics;
using System.IO;
using System.Net.Sockets;
using System.Threading;

namespace ShadowXLab
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.Title = "ShadowXLab Cyber Range Platform - Localhost Runner";
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine("======================================================================");
            Console.WriteLine("        SHADOWXLAB CYBER RANGE APPLIANCE · ENTERPRISE EDITION");
            Console.WriteLine("        SOC Analyst Master Track & VirtualBox Lab Hypervisor");
            Console.WriteLine("======================================================================");
            Console.ResetColor();

            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            string backendDir = Path.Combine(baseDir, "backend");
            string launcherPy = Path.Combine(baseDir, "desktop_launcher.py");

            Console.WriteLine("[*] Root Directory: " + baseDir);

            // 1. Check VirtualBox
            string vboxPath = @"C:\Program Files\Oracle\VirtualBox\VBoxManage.exe";
            if (File.Exists(vboxPath))
            {
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("[+] Oracle VirtualBox Engine Detected: " + vboxPath);
                Console.ResetColor();
            }
            else
            {
                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.WriteLine("[!] Note: VirtualBox not found at default location.");
                Console.ResetColor();
            }

            // 2. Launch desktop_launcher.py via Python
            string pythonExe = "python.exe";
            ProcessStartInfo psi = new ProcessStartInfo();
            psi.FileName = pythonExe;
            psi.Arguments = "\"" + launcherPy + "\"";
            psi.WorkingDirectory = baseDir;
            psi.UseShellExecute = false;

            try
            {
                Console.WriteLine("[*] Launching ShadowXLab Core Platform services...");
                Process p = Process.Start(psi);
                if (p != null)
                {
                    p.WaitForExit();
                }
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.WriteLine("[-] Direct Python launch notice: " + ex.Message);
                Console.WriteLine("[*] Launching batch fallback...");
                Console.ResetColor();

                string batPath = Path.Combine(baseDir, "start-shadowxlab.bat");
                if (File.Exists(batPath))
                {
                    Process.Start(new ProcessStartInfo("cmd.exe", "/c \"" + batPath + "\"") { WorkingDirectory = baseDir });
                }
            }
        }
    }
}
