            var Output = $('#output');

            function log(message) {
                if (typeof(message) === 'object') {
                    message = JSON.stringify(message);
                }
                Output.html(Output.html() + '\n' + message);
            }

            var _syncTests = 0, _syncTestsFailed = 0;

            function assertTrue(condition, message) {
                _syncTests++;
                if (!condition) {
                    _syncTestsFailed++;
                    log('Assert Failed: ' + message);
                }
            }

            var _asyncTests = 0;

            function beginAsyncTest() {
                _asyncTests++;
            }

            function endAsyncTest() {
                _asyncTests--;
            }

            function waitAsyncTests() {
                if (_asyncTests === 0) {
                    log('Async tests complete.');
                    return;
                }
                log('Waiting for async tests to finish.');
                var waiting = setInterval(function() {
                    if (_asyncTests === 0) {
                        clearInterval(waiting);
                        log('Async tests complete.');
                    }
                }, 1000);
            }

