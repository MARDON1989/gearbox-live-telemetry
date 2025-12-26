"""
MTEL - Mardon Telemetry Enhanced Agent
Captures comprehensive telemetry data from iRacing and sends it to the central server
"""

import irsdk
import socketio
import time
import socket
import os
from datetime import datetime
from collections import deque

# Configuration
SERVER_URL = os.environ.get('SERVER_URL', 'http://localhost:3000')
DRIVER_NAME = os.environ.get('DRIVER_NAME', 'Driver')
COMPUTER_NAME = socket.gethostname()

# Initialize Socket.IO client
sio = socketio.Client()

# Initialize iRacing SDK
ir = irsdk.IRSDK()

# State tracking
current_session_id = None
last_lap_number = -1
is_connected = False
in_session = False
fuel_history = deque(maxlen=10)  # Track last 10 laps of fuel usage
lap_times_history = deque(maxlen=5)  # Track last 5 lap times


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
    global is_connected, in_session
    print('Disconnected from server')
    is_connected = False
    if in_session:
        end_session()


@sio.event
def connect_error(data):
    print(f'Connection error: {data}')


@sio.event
def execute_command(data):
    """Handle button box commands from server"""
    button = data.get('button')
    action = data.get('action')
    keybind = data.get('keybind')  # Get the actual keybind string
    
    print(f'Executing command: {button} - {action} - keybind: {keybind}')
    
    # If no keybind provided, use defaults
    if not keybind:
        keybind_map = {
            'engine-toggle': 'i',
            'engine-start': 's',
            'headlights': 'l',
            'push-to-talk': 'v',
            'tearoff': 't',
            'brake-bias-up': ']',
            'brake-bias-down': '[',
            'fuel-up': '=',
            'fuel-down': '-'
        }
        keybind = keybind_map.get(button, '')
    
    if not keybind:
        print(f'No keybind found for button: {button}')
        return
    
    try:
        import pyautogui
        
        # Helper function to parse and execute keybinds with modifiers
        def execute_keybind(keybind_str, hold=False):
            """Execute a keybind that may include modifiers like Ctrl+Shift+F"""
            if not keybind_str:
                return
                
            # Parse keybind string (e.g., "Ctrl+Shift+F" or just "i")
            parts = keybind_str.split('+')
            
            # Map modifier names to pyautogui keys
            modifier_map = {
                'Ctrl': 'ctrl',
                'Alt': 'alt',
                'Shift': 'shift',
                'Space': 'space',
                'Esc': 'escape'
            }
            
            modifiers = []
            main_key = parts[-1].lower()  # Last part is the main key
            
            # Check if main key is a special key
            if main_key in [m.lower() for m in modifier_map.keys()]:
                for key, value in modifier_map.items():
                    if key.lower() == main_key:
                        main_key = value
                        break
            
            # Extract modifiers
            for part in parts[:-1]:
                if part in modifier_map:
                    modifiers.append(modifier_map[part])
            
            # Execute the keybind
            if hold:
                # Hold down modifiers
                for mod in modifiers:
                    pyautogui.keyDown(mod)
                pyautogui.keyDown(main_key)
            else:
                # Press and release
                if modifiers:
                    # Use hotkey for modifier combinations
                    pyautogui.hotkey(*modifiers, main_key)
                else:
                    pyautogui.press(main_key)
        
        def release_keybind(keybind_str):
            """Release a held keybind"""
            if not keybind_str:
                return
                
            parts = keybind_str.split('+')
            modifier_map = {
                'Ctrl': 'ctrl',
                'Alt': 'alt',
                'Shift': 'shift',
                'Space': 'space',
                'Esc': 'escape'
            }
            
            modifiers = []
            main_key = parts[-1].lower()
            
            if main_key in [m.lower() for m in modifier_map.keys()]:
                for key, value in modifier_map.items():
                    if key.lower() == main_key:
                        main_key = value
                        break
            
            for part in parts[:-1]:
                if part in modifier_map:
                    modifiers.append(modifier_map[part])
            
            # Release in reverse order
            pyautogui.keyUp(main_key)
            for mod in reversed(modifiers):
                pyautogui.keyUp(mod)
        
        # Execute based on action
        if action in ['press', 'on']:
            execute_keybind(keybind, hold=(action == 'press' and button == 'push-to-talk'))
        elif action == 'release':
            release_keybind(keybind)
        
    except Exception as e:
        print(f'Error executing command: {e}')


def format_lap_time(seconds):
    """Format lap time in seconds to readable format"""
    if seconds <= 0:
        return None
    return round(seconds, 3)


def get_track_info():
    """Get detailed track information"""
    try:
        weekend_info = ir['WeekendInfo']
        return {
            'trackName': weekend_info['TrackDisplayName'],
            'trackConfig': weekend_info['TrackConfigName'],
            'trackLength': weekend_info['TrackLength']
        }
    except:
        return {
            'trackName': 'Unknown',
            'trackConfig': '',
            'trackLength': 0
        }


def get_car_info():
    """Get detailed car information"""
    try:
        driver_info = ir['DriverInfo']
        driver_idx = driver_info['DriverCarIdx']
        driver = driver_info['Drivers'][driver_idx]
        
        return {
            'carName': driver['CarScreenName'],
            'carClass': driver['CarClassShortName'],
            'carNumber': driver['CarNumber']
        }
    except:
        return {
            'carName': 'Unknown',
            'carClass': '',
            'carNumber': 0
        }


def get_session_info():
    """Get session type information"""
    try:
        session_info = ir['SessionInfo']
        current_session = session_info['Sessions'][ir['SessionNum']]
        return current_session['SessionType']
    except:
        return 'Practice'


def calculate_fuel_remaining_laps(current_fuel, avg_fuel_per_lap):
    """Calculate estimated laps remaining based on fuel"""
    if avg_fuel_per_lap <= 0:
        return 0
    return current_fuel / avg_fuel_per_lap


def get_race_standings():
    """Get current race standings and gaps"""
    try:
        # Get current driver's info
        my_driver_info = ir['DriverInfo']['Drivers'][ir['DriverInfo']['DriverCarIdx']]
        my_class_id = my_driver_info['CarClassID']
        
        standings = []
        drivers = ir['DriverInfo']['Drivers']
        positions = ir['CarIdxPosition']
        track_pcts = ir['CarIdxLapDistPct']
        
        for i, driver in enumerate(drivers):
            car_idx = driver['CarIdx']
            
            # Skip if car is not on track or invalid (check for None first)
            pos = positions[car_idx]
            if pos is None or pos <= 0:
                continue
                
            # Calculate gap (simplified - based on lap distance percentage)
            # In a real implementation, this would need to account for laps down, track length, etc.
            gap = 0 
            
            standings.append({
                'carIdx': car_idx,
                'position': positions[car_idx],
                'classPosition': ir['CarIdxClassPosition'][car_idx],
                'carNumber': driver['CarNumber'],
                'driverName': driver['UserName'],
                'carClassId': driver['CarClassID'],
                'isMe': car_idx == ir['DriverInfo']['DriverCarIdx'],
                'lapDistPct': track_pcts[car_idx],
                'irating': driver['IRating'],
                'lastLapTime': ir['CarIdxLastLapTime'][car_idx],
                'bestLapTime': ir['CarIdxBestLapTime'][car_idx]
            })
            
        # Sort by position (official standings)
        standings.sort(key=lambda x: x['position'])
        
        # Create a second array for real-time running order (sorted by track position)
        running_order = sorted(standings, key=lambda x: x['lapDistPct'], reverse=True)
        
        # Calculate gaps relative to leader and me
        if standings:
            leader_pct = standings[0]['lapDistPct']
            my_entry = next((s for s in standings if s['isMe']), None)
            my_pct = my_entry['lapDistPct'] if my_entry else 0
            
            for s in standings:
                # Gap to leader (very rough approximation)
                s['gapToLeader'] = 0 if s['position'] == 1 else (leader_pct - s['lapDistPct'])
                
                # Gap to me
                s['gapToMe'] = s['lapDistPct'] - my_pct
        
        # Get position safely - use CarIdxPosition which is more reliable
        my_car_idx = ir['DriverInfo']['DriverCarIdx']
        my_position = ir['CarIdxPosition'][my_car_idx]
        my_class_position = ir['CarIdxClassPosition'][my_car_idx]
        
        if my_position is None or my_position == 0:
            print(f"Warning: Position is {my_position}, ClassPosition is {my_class_position}")
            # Fallback: try to get from standings array
            my_entry = next((s for s in standings if s['isMe']), None)
            if my_entry:
                my_position = my_entry['position']
                my_class_position = my_entry['classPosition']
                print(f"Using position from standings: P{my_position}, Class P{my_class_position}")
        
        # Calculate gap to leader in seconds (not percentage)
        gap_to_leader_seconds = 0
        if standings and len(standings) > 0 and my_position and my_position > 1:
            leader = standings[0]
            my_entry = next((s for s in standings if s['isMe']), None)
            if my_entry and leader:
                # Calculate gap accounting for lap wrapping
                gap_pct = leader['lapDistPct'] - my_entry['lapDistPct']
                # If gap is negative, leader has crossed line and we haven't
                if gap_pct < 0:
                    gap_pct += 1.0  # Add full lap
                
                # Use last lap time or estimate 20 seconds
                try:
                    estimated_lap_time = ir['LapLastLapTime'] if ir['LapLastLapTime'] and ir['LapLastLapTime'] > 0 else 20.0
                except:
                    estimated_lap_time = 20.0
                gap_to_leader_seconds = gap_pct * estimated_lap_time
        
        # Calculate gaps to cars ahead and behind based on RUNNING ORDER (real-time track position)
        for i, driver in enumerate(running_order):
            # Gap to car ahead (car physically in front on track)
            if i > 0:
                car_ahead = running_order[i - 1]
                gap_pct = car_ahead['lapDistPct'] - driver['lapDistPct']
                # Handle lap wrapping
                if gap_pct < 0:
                    gap_pct += 1.0
                try:
                    lap_time = ir['LapLastLapTime'] if ir['LapLastLapTime'] and ir['LapLastLapTime'] > 0 else 20.0
                except:
                    lap_time = 20.0
                driver['gapToAhead'] = gap_pct * lap_time
            else:
                driver['gapToAhead'] = 0
            
            # Gap to car behind (car physically behind on track)
            if i < len(running_order) - 1:
                car_behind = running_order[i + 1]
                gap_pct = driver['lapDistPct'] - car_behind['lapDistPct']
                # Handle lap wrapping
                if gap_pct < 0:
                    gap_pct += 1.0
                try:
                    lap_time = ir['LapLastLapTime'] if ir['LapLastLapTime'] and ir['LapLastLapTime'] > 0 else 20.0
                except:
                    lap_time = 20.0
                driver['gapToBehind'] = gap_pct * lap_time
            else:
                driver['gapToBehind'] = 0
        
        # Also update the official standings array with the same gap data
        # (so both arrays have the gap info)
        for standing_driver in standings:
            running_driver = next((d for d in running_order if d['carIdx'] == standing_driver['carIdx']), None)
            if running_driver:
                standing_driver['gapToAhead'] = running_driver['gapToAhead']
                standing_driver['gapToBehind'] = running_driver['gapToBehind']
        
        return {
            'position': my_position if my_position is not None else 0,
            'classPosition': my_class_position if my_class_position is not None else 0,
            'gapToLeader': gap_to_leader_seconds,
            'drivers': standings,
            'runningOrder': running_order  # Real-time track position order
        }
    except Exception as e:
        print(f"Error getting standings: {e}")
        import traceback
        traceback.print_exc()
        return {
            'position': 0,
            'classPosition': 0,
            'gapToLeader': 0,
            'drivers': []
        }


def get_lap_split_times():
    """Get sector/split times if available"""
    try:
        # iRacing doesn't always provide sector times directly
        # We'll use what's available
        return {
            'sector1Time': None,  # Not directly available in basic SDK
            'sector2Time': None,
            'sector3Time': None
        }
    except:
        return {
            'sector1Time': None,
            'sector2Time': None,
            'sector3Time': None
        }


def get_comprehensive_telemetry():
    """Extract comprehensive telemetry data from iRacing"""
    if not ir.is_connected:
        return None
    
    try:
        # Basic lap info
        lap_number = ir['Lap']
        current_lap_time = ir['LapCurrentLapTime']
        last_lap_time = ir['LapLastLapTime']
        best_lap_time = ir['LapBestLapTime']
        
        # Fuel data
        fuel_level = ir['FuelLevel']
        fuel_level_pct = ir['FuelLevelPct']
        
        # Tire Data - All 4 tires
        tires = {
            'LF': {
                'pressure': ir['LFcoldPressure'],  # Cold pressure is more reliable
                'tempL': ir['LFtempCL'],
                'tempM': ir['LFtempCM'],
                'tempR': ir['LFtempCR'],
                'wearL': ir['LFwearL'],
                'wearM': ir['LFwearM'],
                'wearR': ir['LFwearR']
            },
            'RF': {
                'pressure': ir['RFcoldPressure'],
                'tempL': ir['RFtempCL'],
                'tempM': ir['RFtempCM'],
                'tempR': ir['RFtempCR'],
                'wearL': ir['RFwearL'],
                'wearM': ir['RFwearM'],
                'wearR': ir['RFwearR']
            },
            'LR': {
                'pressure': ir['LRcoldPressure'],
                'tempL': ir['LRtempCL'],
                'tempM': ir['LRtempCM'],
                'tempR': ir['LRtempCR'],
                'wearL': ir['LRwearL'],
                'wearM': ir['LRwearM'],
                'wearR': ir['LRwearR']
            },
            'RR': {
                'pressure': ir['RRcoldPressure'],
                'tempL': ir['RRtempCL'],
                'tempM': ir['RRtempCM'],
                'tempR': ir['RRtempCR'],
                'wearL': ir['RRwearL'],
                'wearM': ir['RRwearM'],
                'wearR': ir['RRwearR']
            }
        }
        
        # Track position
        lap_dist_pct = ir['LapDistPct']
        is_on_track = ir['IsOnTrack']
        
        # Car state
        speed = ir['Speed'] * 3.6  # Convert m/s to km/h
        rpm = ir['RPM']
        gear = ir['Gear']
        throttle = ir['Throttle']
        brake = ir['Brake']
        
        # Session info
        session_time = ir['SessionTime']
        session_laps = ir['SessionLapsRemain']
        
        # Static Info (Track/Car)
        track_info = get_track_info()
        car_info = get_car_info()
        
        # Environmental Data
        try:
            air_temp = ir['AirTemp']
            track_temp = ir['TrackTempCrew']
            wind_speed = ir['WindVel']
            wind_dir = ir['WindDir']
            weather_type = ir['WeatherType'] # 0=Constant, 1=Dynamic
            skies = ir['Skies'] # 0=Clear, 1=Partly Cloudy, 2=Cloudy, 3=Overcast
        except Exception as e:
            # Fallback if data is missing (e.g. session not fully loaded)
            air_temp = 0
            track_temp = 0
            wind_speed = 0
            wind_dir = 0
            weather_type = 0
            skies = 0
            # print(f"Warning: Environmental data missing: {e}")
        
        # Race standings
        standings = get_race_standings()
        
        # Split times
        splits = get_lap_split_times()
        
        return {
            'lapNumber': lap_number,
            'currentLapTime': current_lap_time,
            'lastLapTime': last_lap_time,
            'bestLapTime': best_lap_time,
            'fuelLevel': fuel_level,
            'fuelLevelPct': fuel_level_pct,
            'tires': tires,
            'lapDistPct': lap_dist_pct,
            'isOnTrack': is_on_track,
            'speed': speed,
            'rpm': rpm,
            'gear': gear,
            'throttle': throttle,
            'brake': brake,
            'clutch': ir['Clutch'],
            'steeringAngle': ir['SteeringWheelAngle'],
            'sessionTime': session_time,
            'sessionLaps': session_laps,
            'sessionFlags': ir['SessionFlags'],
            'onPitRoad': ir['OnPitRoad'],
            'trackName': track_info['trackName'],
            'trackConfig': track_info['trackConfig'],
            'trackLength': track_info['trackLength'],
            'carName': car_info['carName'],
            'carClass': car_info['carClass'],
            'driverName': DRIVER_NAME,
            'airTemp': air_temp,
            'trackTemp': track_temp,
            'windSpeed': wind_speed,
            'windDir': wind_dir,
            'weatherType': weather_type,
            'skies': skies,
            'position': standings['position'],
            'classPosition': standings['classPosition'],
            'gapToLeader': standings['gapToLeader'],
            'standings': standings['drivers'],
            'runningOrder': standings.get('runningOrder', standings['drivers']),  # Add running order
            'sector1Time': splits['sector1Time'],
            'sector2Time': splits['sector2Time'],
            'sector3Time': splits['sector3Time'],
            'last5Laps': list(lap_times_history),
            # Get gaps from my entry in standings
            'gapToAhead': next((d['gapToAhead'] for d in standings['drivers'] if d.get('isMe')), 0),
            'gapToBehind': next((d['gapToBehind'] for d in standings['drivers'] if d.get('isMe')), 0)
        }
    except Exception as e:
        print(f"Error getting telemetry: {e}")
        return None


def start_session():
    """Start a new session"""
    global in_session, current_session_id
    
    track_info = get_track_info()
    car_info = get_car_info()
    session_type = get_session_info()
    
    print(f'Starting session: {track_info["trackName"]} in {car_info["carName"]}')
    
    if is_connected:
        sio.emit('session-start', {
            **track_info,
            **car_info,
            'sessionType': session_type
        })
    
    in_session = True


def end_session():
    """End the current session"""
    global in_session, last_lap_number
    
    if in_session and is_connected:
        # Calculate session stats
        best_lap = min(lap_times_history) if lap_times_history else 0
        
        sio.emit('session-end', {
            'totalLaps': last_lap_number,
            'bestLapTime': best_lap
        })
        
        print(f'Session ended: {last_lap_number} laps completed')
    
    in_session = False
    last_lap_number = -1
    fuel_history.clear()
    lap_times_history.clear()


def main():
    global last_lap_number, in_session
    
    print(f'MTEL - Mardon Telemetry Enhanced Agent')
    print(f'Driver: {DRIVER_NAME}')
    print(f'Computer: {COMPUTER_NAME}')
    print(f'Server: {SERVER_URL}')
    print('-' * 60)
    
    # Connect to server
    try:
        sio.connect(SERVER_URL)
    except Exception as e:
        print(f'Failed to connect to server: {e}')
        print('Continuing in offline mode...')
    
    print('Waiting for iRacing...')
    
    last_fuel_level = 0
    
    # Pit tracking
    pit_tracking = {}  # {carIdx: {'inPit': bool, 'pitEntry': time, 'lastPitLap': int, 'lastPitDuration': float}}
    
    while True:
        try:
            # Check if connected to iRacing
            if not ir.startup():
                # If not connected, try to connect every 2 seconds
                time.sleep(2)
                continue

            # Check if we need to start a new session
            if not in_session:
                start_session()
                print('iRacing detected! Monitoring telemetry...')

            # Get data
            data = get_comprehensive_telemetry()
            
            if data:
                # Initialize last_fuel_level on first data read
                if last_fuel_level == 0:
                    last_fuel_level = data['fuelLevel']
                    print(f"Initialized fuel tracking at {last_fuel_level:.2f}L")
                
                # Send to server
                if sio.connected:
                    sio.emit('telemetry-data', data)
                
                # Lap processing logic
                current_lap = data['lapNumber']
                
                # Check if a new lap was completed (fixed: allow last_lap_number to be -1 for first lap)
                if current_lap > last_lap_number and last_lap_number > -1:
                    lap_time = data['lastLapTime']
                    
                    print(f"Lap transition detected: {last_lap_number} -> {current_lap}, lap_time: {lap_time}")
                    
                    # Handle lap time (-1 means not timed, but we still want to track fuel)
                    if lap_time > 0:
                        formatted_time = format_lap_time(lap_time)
                    else:
                        # Use -1 or current lap time as fallback
                        formatted_time = "--:--.---"
                        print(f"Warning: Lap {last_lap_number} has invalid lap time ({lap_time}), using placeholder")
                    
                    lap_times_history.append({
                        'lap': last_lap_number,
                        'time': formatted_time
                    })
                    
                    # Keep only last 5 laps
                    if len(lap_times_history) > 5:
                        lap_times_history.pop(0)
                        
                    # Calculate fuel used (always track this, even if lap time is invalid)
                    fuel_used = 0
                    if last_fuel_level > 0:
                        fuel_used = last_fuel_level - data['fuelLevel']
                        print(f"DEBUG: Fuel calc: last={last_fuel_level:.2f}L, current={data['fuelLevel']:.2f}L, used={fuel_used:.2f}L")
                        if fuel_used > 0:  # Only add positive fuel usage
                            fuel_history.append(fuel_used)
                    
                    # Calculate fuel analysis
                    avg_fuel_per_lap = sum(fuel_history) / len(fuel_history) if fuel_history else 0
                    laps_remaining = calculate_fuel_remaining_laps(data['fuelLevel'], avg_fuel_per_lap)
                    
                    print(f'Lap {last_lap_number} completed: {formatted_time} | '
                          f'Fuel: {data["fuelLevel"]:.2f}L | '
                          f'Fuel used: {fuel_used:.2f}L | '
                          f'Avg fuel/lap: {avg_fuel_per_lap:.2f}L | '
                          f'Laps remaining: {laps_remaining:.1f} | '
                          f'P{data["position"]}')
                    
                    # Send lap completion data to server (even if lap time is invalid)
                    if sio.connected:
                        print(f"Sending lap-completed event for lap {last_lap_number}")
                        sio.emit('lap-completed', {
                            'lapNumber': last_lap_number,
                            'lapTime': lap_time if lap_time > 0 else 0,  # Send 0 instead of -1
                            'isValid': lap_time > 0,  # Mark as invalid if -1
                            'fuelUsed': fuel_used,
                            'position': data['position'] if data['position'] is not None else 0,
                            'fuelAnalysis': {
                                'avgFuelPerLap': avg_fuel_per_lap,
                                'lapsRemaining': laps_remaining,
                                'totalFuelUsed': sum(fuel_history)
                            }
                        })
                    else:
                        print("WARNING: Not connected to server, cannot send lap-completed event")
                    
                    # Update fuel level AFTER we've used it for calculation
                    last_fuel_level = data['fuelLevel']
                
                # Update lap number (always update this)
                last_lap_number = current_lap
                
                # Pit tracking logic
                try:
                    car_idx_on_pit = ir['CarIdxOnPitRoad']
                    current_time = time.time()
                    
                    for car_idx in range(len(car_idx_on_pit)):
                        is_on_pit = car_idx_on_pit[car_idx]
                        
                        # Initialize tracking for this car if needed
                        if car_idx not in pit_tracking:
                            pit_tracking[car_idx] = {
                                'inPit': False,
                                'pitEntry': None,
                                'lastPitLap': 0,
                                'lastPitDuration': 0
                            }
                        
                        # Detect pit entry
                        if is_on_pit and not pit_tracking[car_idx]['inPit']:
                            pit_tracking[car_idx]['inPit'] = True
                            pit_tracking[car_idx]['pitEntry'] = current_time
                            print(f"Car {car_idx} entered pit")
                        
                        # Detect pit exit
                        elif not is_on_pit and pit_tracking[car_idx]['inPit']:
                            pit_tracking[car_idx]['inPit'] = False
                            pit_duration = current_time - pit_tracking[car_idx]['pitEntry']
                            pit_tracking[car_idx]['lastPitDuration'] = pit_duration
                            pit_tracking[car_idx]['lastPitLap'] = current_lap
                            
                            print(f"Car {car_idx} exited pit after {pit_duration:.2f}s")
                            
                            # Emit pit stop event
                            if sio.connected:
                                sio.emit('pit-stop', {
                                    'carIdx': car_idx,
                                    'lapNumber': current_lap,
                                    'duration': pit_duration
                                })
                except Exception as e:
                    print(f"Error in pit tracking: {e}")

            # Sleep to control update rate (e.g. 20Hz = 0.05s)
            time.sleep(0.05)
            
        except KeyboardInterrupt:
            print('\nShutting down...')
            break
        except Exception as e:
            print(f"Error in telemetry loop: {e}")
            # Sleep briefly to avoid spamming errors if something is persistently wrong
            time.sleep(1)
    
    # Cleanup
    if in_session:
        end_session()
    if is_connected:
        sio.disconnect()
    ir.shutdown()
    print('Agent stopped')

if __name__ == '__main__':
    main()
