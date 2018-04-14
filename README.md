# http-range-dat

Test Proxying HTTP Range Requests to [DAT](http://datproject.org/) random access.

Serve entire file from DAT:
```
curl http://localhost:7000/<DAT KEY>/path/to/file
```

Retrieve byte range 10-200 from DAT:
```
curl -r 10-200 http://localhost:7000/<DAT KEY>/path/to/file
```

Entirely experimental.
