# Install and start VSM7 on Windows

This guide takes you from downloading the files to opening VSM7 in your browser. No programming experience is needed. Complete steps 1–3 once; use steps 4–6 whenever you want to start VSM7.

## 1. Install Anaconda

Anaconda includes Python, which VSM7 needs to run on your computer.

1. Open the [Anaconda download page](https://www.anaconda.com/download).
2. Follow the download prompts, including registration if requested. Choose **Anaconda Distribution → Windows → 64-Bit Graphical Installer**.
3. Open your **Downloads** folder and double-click the downloaded installer.
4. Click **Next**, read and accept the terms if you agree, and choose **Just Me** when asked who to install it for.
5. Keep the suggested installation folder. Leave **Add Anaconda to my PATH environment variable** unchecked if that option appears.
6. Click **Install**, wait for installation to finish, then click **Next** and **Finish** as prompted.

These steps follow the [official Anaconda Windows installation guide](https://www.anaconda.com/docs/getting-started/anaconda/install/windows-gui-install).

## 2. Download VSM7

1. Open the [VSM7 GitHub page](https://github.com/MarkLambertz/VSM7).
2. Click the green **Code** button above the file list.
3. Click **Download ZIP**.
4. Open your **Downloads** folder, right-click the downloaded ZIP file, and choose **Extract All… → Extract**.
5. Open the extracted folders until you see **start.bat**, **index.html**, and the **src** and **scripts** folders together. This is the VSM7 application folder, usually named **VSM7-main**.

Extract the ZIP before continuing. You do not need to install Git or create a GitHub account.

## 3. Put VSM7 in your personal folder

1. In the application folder from step 2, press **Ctrl+A**, then **Ctrl+C** to copy all its files and folders.
2. Open a new File Explorer window with **Windows+E**.
3. Click the address bar at the top, type `%USERPROFILE%`, and press **Enter**. This opens your personal folder, such as `C:\Users\Alex`.
4. Create a new folder named **VSM7**, then open it.
5. Press **Ctrl+V** to paste everything into this folder.

**Check:** Opening your new **VSM7** folder should show **start.bat** directly inside it. If you see only another folder called **VSM7-main**, open that folder and move its contents up into **VSM7**.

## 4. Open Anaconda Prompt

1. Click the Windows **Start** button.
2. Type **Anaconda Prompt**.
3. Open the app named **Anaconda Prompt**.

This is the Anaconda shell used in this guide. You can open it directly without opening Anaconda Navigator. A window with a blinking cursor should appear, usually with `(base)` at the start of the line. See [Anaconda's instructions for opening the prompt](https://www.anaconda.com/docs/getting-started/anaconda/install/windows-gui-install#verify-your-install).

## 5. Go to the VSM7 folder

Copy this line into Anaconda Prompt and press **Enter**:

```bat
cd /d "%USERPROFILE%\VSM7"
```

Copy the command exactly, including the quotation marks. Windows replaces `%USERPROFILE%` with your personal folder automatically.

The line before the blinking cursor should now end in `\VSM7>`.

If you saved VSM7 somewhere else, open that folder in File Explorer, copy its full path from the address bar, and use it inside the quotation marks after `cd /d`.

## 6. Start VSM7

Type this command and press **Enter**:

```bat
start.bat
```

Wait a few seconds. Your browser should open and display VSM7.

If the browser does not open automatically, open it yourself and go to [Open VSM7 on this computer](http://localhost:4173/).

**Keep the Anaconda Prompt window open while using VSM7.** You can minimize it.

## Stop VSM7 and open it again later

To stop VSM7, return to Anaconda Prompt and press **Ctrl+C**. If Windows asks **Terminate batch job (Y/N)?**, type **Y** and press **Enter**. You can then close the prompt and browser tab.

Next time, repeat steps 4–6. There is no need to download or install everything again.

## Where your work is saved

With this launcher, VSM7 saves project files in a folder called **VSM7-Workspaces** inside your **VSM7** folder. Back up that folder regularly and keep it when replacing or updating the application files.

## If something goes wrong

| What you see | What to do |
| --- | --- |
| **The system cannot find the path specified** | Check that your personal folder contains **VSM7**. If you chose another location, use its full path in step 5. |
| **'start.bat' is not recognized** | Check that **start.bat** is directly inside the folder you selected. You may be one folder above the extracted application files. |
| **Python 3 was not found** | Make sure Anaconda finished installing, then open **Anaconda Prompt** from the Start menu and repeat steps 5–6. |
| **Missing scripts\vsm7_file_server.py** | Extract the ZIP again and copy all files and folders, including **scripts**, into **VSM7**. |
| **Port 4173 is already used** | If an earlier VSM7 prompt is still open, stop it with **Ctrl+C** and try again. If you cannot identify the other application, ask for help with the displayed message. |
| The browser says **This site can't be reached** | Keep Anaconda Prompt open and check it for an error. Once VSM7 is running, reload the browser page. |
