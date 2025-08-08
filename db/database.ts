import SQLite from 'react-native-sqlite-storage';
import { Restaurant } from '../types/restaurantType';

const markedPlacesTableName = 'marked_places';

const db = SQLite.openDatabase(
    {
        name: 'placeMarker.db',
        location: 'default',
    },
    () => {
        console.log('Database opened');
    },
    error => {
        console.log('Error opening database', error);
    }
);

// For creating 'marked_places' table for storing inforamtion for the marked places. 
export const createTables = () => {
    db.transaction(tx => {
        tx.executeSql(
            `CREATE TABLE IF NOT EXISTS ${markedPlacesTableName} (mp_id INTEGER PRIMARY KEY AUTOINCREMENT, place_id string, name string, latitude decimal(9,6), longitude decimal(9,6), address string)`
        );
    });
};

// For inserting new records i.e newly marked places info into the table
export const insertMarkedPlaceDB = ({id: place_id, name, latitude, longitude, address}:Restaurant, callback?: () => void) => {
    db.transaction(tx => {
        tx.executeSql(
            `INSERT INTO ${markedPlacesTableName} (place_id, name, latitude, longitude, address) VALUES (?, ?, ?, ?, ?) WHERE NOT EXISTS (SELECT 1 FROM marked_places WHERE place_id = ?);`, [place_id, name, latitude, longitude, address, place_id], () => {
                console.log('Insertion successful');
                
                callback?.();
            },
            (_, error) => {
                console.error('Insert failed:', error.message);
                return false; // returning false to propagate error
            } 
        );
    });
};

// For fetching all the table records i.e list of marked places
export const fetchMarkedPlacesDB = (callback: (restaurants: Restaurant[]) => void)=> {
    db.transaction(tx => {
        tx.executeSql(`SELECT * FROM ${markedPlacesTableName};`, [], (_, {rows}) => {
            const places = rows.raw();
            const restaurants : Restaurant[] = places.map((item): Restaurant => ({
                id: item.place_id,
                name: item.name,
                latitude: item.latitude,
                longitude: item.longitude,
                address: item.address,
            }));
            callback(restaurants);
        });
    });
};

// For deleting a record in the table i.e. for unmarking a place
export const deleteMarkedPlaceDB = (place_id:string, callback?: () => void)=> {
    db.transaction(tx => {
        tx.executeSql(`DELETE FROM ${markedPlacesTableName} WHERE place_id = ?;`, [place_id], () => {
            callback?.();
        });
    });
};