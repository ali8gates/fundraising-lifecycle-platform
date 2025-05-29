#!/bin/bash
# Double-click this file in Finder to open Terminal and start the demo.
# (Running from Cursor's terminal will fail with "operation not permitted" on the port.)

DIR="/Users/ali8gates/Documents/PythonProjects/chti-innovators-network"
osascript -e "tell application \"Terminal\" to do script \"cd '$DIR' && ./launch.sh\""
