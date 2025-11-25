"""
iRacing Telemetry Agent
Captures telemetry data from iRacing and sends it to the central server
"""

import irsdk
import socketio
import time
import socket
import os
from datetime import datetime

# Configuration
SERVER_URL = 'http://localhost:3000'  # Change this to your server IP
DRIVER_NAME = os.environ.get('DRIVER_NAME', 'Driver')  # Set via environment variable or change here
COMPUTER_NAME = socket.gethostname()

# Initialize Socket.IO client
sio = socketio.Client()

# Initialize iRacing SDK
ir = irsdk.IRSDK()

# State tracking
last_lap_number = -1
is_connected = False


@sio.event
def connect():
    global is_connected
    print(f'Connected to server at {SERVER_URL}')
    is_connected = True
    
    # Register this agent
    sio.emit('register-agent', {
        'driverName': DRIVER_NAME,
        'computerName': COMPUTER_NAME
    })


@sio.event
def disconnect():
    global is_connected
    print('Disconnected from server')
    is_connected = False


@sio.event
def connect_error(data):
    print(f'Connection error: {data}')


def format_lap_time(seconds):
    """Format lap time in seconds to readable format"""
    if seconds <= 0:
        return None
    return round(seconds, 3)


def get_telemetry_data():
    """Extract relevant telemetry data from iRacing"""
    if not ir.is_connected:
        return None
    
    try:
        # Get current lap number
        lap_number = ir['Lap']
        
        # Get last lap time
        last_lap_time = ir['LapLastLapTime']
        
        # Get track and car info
        track_name = ir['WeekendInfo']['TrackDisplayName']
        car_name = ir['DriverInfo']['Drivers'][ir['DriverInfo']['DriverCarIdx']]['CarScreenName']
        
        # Check if lap is valid (not in pits, no off-tracks, etc.)
        is_on_track = ir['IsOnTrack']
        lap_dist_pct = ir['LapDistPct']
        
        return {
            'lapNumber': lap_number,
            'lastLapTime': last_lap_time,
            'trackName': track_name,
            'carName': car_name,
            'isOnTrack': is_on_track,
            'lapDistPct': lap_dist_pct,
            'speed': ir['Speed'],
            'gear': ir['Gear'],
            'rpm': ir['RPM']
        }
    except Exception as e:
        print(f'Error getting telemetry: {e}')
        return None


def main():
    global last_lap_number
    
    print(f'iRacing Telemetry Agent')
    print(f'Driver: {DRIVER_NAME}')
    print(f'Computer: {COMPUTER_NAME}')
    print(f'Server: {SERVER_URL}')
    print('-' * 50)
    
    # Connect to server
    try:
        sio.connect(SERVER_URL)
    except Exception as e:
        print(f'Failed to connect to server: {e}')
        return
    
    print('Waiting for iRacing...')
    
    while True:
        try:
            # Check if iRacing is running
            if ir.startup():
                print('iRacing detected! Monitoring telemetry...')
                
                while ir.is_connected:
                    # Get telemetry data
                    data = get_telemetry_data()
                    
                    if data:
                        current_lap = data['lapNumber']
                        
                        # Check if a new lap was completed
                        if current_lap > last_lap_number and last_lap_number >= 0:
                            lap_time = data['lastLapTime']
                            
                            if lap_time > 0:
                                formatted_time = format_lap_time(lap_time)
                                
                                print(f'Lap {current_lap} completed: {formatted_time}s')
                                
                                # Send lap data to server
                                if is_connected:
                                    sio.emit('telemetry-data', {
                                        'lapTime': formatted_time,
                                        'lapNumber': current_lap,
                                        'trackName': data['trackName'],
                                        'carName': data['carName'],
                                        'isValid': data['isOnTrack']
                                    })
                        
                        last_lap_number = current_lap
                    
                    # Sleep to avoid overwhelming the server
                    time.sleep(0.1)
                
                print('iRacing disconnected')
                last_lap_number = -1
            
            # Wait before checking again
            time.sleep(1)
            
        except KeyboardInterrupt:
            print('\nShutting down...')
            break
        except Exception as e:
            print(f'Error: {e}')
            time.sleep(5)
    
    # Cleanup
    if is_connected:
        sio.disconnect()
    ir.shutdown()
    print('Agent stopped')


if __name__ == '__main__':
    main()
