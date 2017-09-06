import 'rxjs/add/operator/share';

import { Injectable }   from '@angular/core';
import { Observable }   from 'rxjs/Observable';

import { DataService }  from '../core/data.service';

@Injectable()
export class ManufacturersService {
    public manufacturer$;
    private _manufacturerObserver;
    private _dataStore;
    private _getInProgress: boolean = false;

    constructor(
        private _data: DataService
    ) {
        this.manufacturer$ = new Observable(observer => this._manufacturerObserver = observer).share();
        this._dataStore = [];
    }

    create (data) {
        return this._data.post('v3/manufacturers', data).toPromise()
            .then(
                response => {
                    data.id = response.json().data.id;
                    this._include(data);
                    this._manufacturerObserver.next(this._dataStore);
                    return data;
                },
                error => {
                    throw error.json();
                });
    }

    get () {
        // If get() is already running by someone else, don't run it again
        if (!this._getInProgress && this._dataStore.length === 0) {
            this._getInProgress = true;

            return this._data.get('v3/manufacturers')
                .map(res => res.json().data.manufacturers)
                .subscribe(data => {
                    // Set the new data and broadcast it to all listeners
                    this._dataStore = this._sort(data);
                    this._manufacturerObserver.next(this._dataStore);
                    this._getInProgress = false;
                }, error => console.error('Unable to fetch mail templates', error))
            ;
        } else {
            // Just send the data we have
            this._manufacturerObserver.next(this._dataStore);
        }
    }

    delete (id) {
        return new Promise<void>((resolve, reject) => {
            this._data.delete(`v3/manufacturers/${id}`)
                .subscribe(
                    () => {
                        this._exclude(id);
                        this._manufacturerObserver.next(this._dataStore);
                        resolve();
                    },
                    error => {
                        reject(error.json());
                    });
        });
    }

    private _include(item) {
        this._dataStore =
            this._dataStore
                .filter(b => b.id !== item.id)
                .concat(item);

        this._sort(this._dataStore);
    }

    private _exclude(id) {
        this._dataStore = this._dataStore.filter(b => b.id !== id);
    }

    private _sort(items) {
        return items.sort((a, b) => a && b && a.name.localeCompare(b.name));
    }
}
