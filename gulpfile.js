const gulp = require('gulp');
const babel = require('gulp-babel');
const browserify = require('browserify');
const buffer = require('vinyl-buffer');
const concat = require('gulp-concat');
const connect = require('gulp-connect');
const jasmine = require('gulp-jasmine-livereload-task');
const merge = require('merge2');
const source = require('vinyl-source-stream');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
const util = require('gulp-util');

const sources = {
    platform: {
        browser: [
            './src/main/platform/browser/Class.js',
            './src/main/platform/browser/utils/LogNative.js',
            './src/main/generic/utils/Log.js',
            './src/main/generic/utils/Observable.js',
            './src/main/platform/browser/database/BaseTypedDB.js',
            './src/main/platform/browser/database/TypedDB.js',
            './src/main/platform/browser/crypto/CryptoLib.js',
            './src/main/platform/browser/network/NetworkConfig.js',
            './src/main/platform/browser/network/webrtc/WebRtcCertificate.js',
            './src/main/platform/browser/network/webrtc/WebRtcConfig.js',
            './src/main/platform/browser/network/webrtc/WebRtcDataChannel.js',
            './src/main/platform/browser/network/webrtc/WebRtcUtils.js',
            './src/main/platform/browser/network/webrtc/WebRtcConnector.js',
            './src/main/platform/browser/network/websocket/WebSocketConnector.js'
        ],
        node: [
            './src/main/platform/nodejs/utils/LogNative.js',
            './src/main/generic/utils/Log.js',
            './src/main/generic/utils/Observable.js',
            './src/main/platform/nodejs/database/TypedDB.js',
            './src/main/platform/nodejs/database/JungleDB.js',
            './src/main/platform/nodejs/crypto/CryptoLib.js',
            './src/main/platform/nodejs/network/webrtc/WebRtcConnector.js',
            './src/main/platform/nodejs/network/websocket/WebSocketConnector.js',
            './src/main/platform/nodejs/network/NetworkConfig.js'
        ]
    },
    generic: [
        './src/main/generic/utils/Services.js',
        './src/main/generic/utils/Synchronizer.js',
        './src/main/generic/utils/Timers.js',
        './src/main/generic/utils/Version.js',
        './src/main/generic/utils/array/ArrayUtils.js',
        './src/main/generic/utils/array/HashMap.js',
        './src/main/generic/utils/array/HashSet.js',
        './src/main/generic/utils/array/Queue.js',
        './src/main/generic/utils/array/IndexedArray.js',
        './src/main/generic/utils/assert/Assert.js',
        './src/main/generic/utils/buffer/BufferUtils.js',
        './src/main/generic/utils/buffer/SerialBuffer.js',
        './src/main/generic/utils/crypto/Crypto.js',
        './src/main/generic/utils/crc/CRC32.js',
        './src/main/generic/utils/database/ObjectDB.js',
        './src/main/generic/utils/database/TypedDBTransaction.js',
        './src/main/generic/utils/number/NumberUtils.js',
        './src/main/generic/utils/merkle/MerkleTree.js',
        './src/main/generic/utils/platform/PlatformUtils.js',
        './src/main/generic/utils/string/StringUtils.js',
        './src/main/generic/consensus/Policy.js',
        './src/main/generic/consensus/base/primitive/Primitive.js',
        './src/main/generic/consensus/base/primitive/Hash.js',
        './src/main/generic/consensus/base/primitive/PrivateKey.js',
        './src/main/generic/consensus/base/primitive/PublicKey.js',
        './src/main/generic/consensus/base/primitive/KeyPair.js',
        './src/main/generic/consensus/base/primitive/Signature.js',
        './src/main/generic/consensus/base/account/Address.js',
        './src/main/generic/consensus/base/account/Balance.js',
        './src/main/generic/consensus/base/account/Account.js',
        './src/main/generic/consensus/base/account/tree/AccountsTreeNode.js',
        './src/main/generic/consensus/base/account/tree/AccountsTreeStore.js',
        './src/main/generic/consensus/base/account/tree/AccountsProof.js',
        './src/main/generic/consensus/base/account/tree/AccountsTree.js',
        './src/main/generic/consensus/base/account/Accounts.js',
        './src/main/generic/consensus/base/block/BlockHeader.js',
        './src/main/generic/consensus/base/block/BlockInterlink.js',
        './src/main/generic/consensus/base/block/BlockBody.js',
        './src/main/generic/consensus/base/block/BlockUtils.js',
        './src/main/generic/consensus/base/transaction/Transaction.js',
        './src/main/generic/consensus/base/block/Block.js',
        './src/main/generic/consensus/base/blockchain/IBlockchain.js',
        './src/main/generic/consensus/base/blockchain/BaseChain.js',
        './src/main/generic/consensus/base/blockchain/BlockChain.js',
        './src/main/generic/consensus/base/blockchain/HeaderChain.js',
        './src/main/generic/consensus/base/blockchain/ChainProof.js',
        './src/main/generic/consensus/base/blockchain/ChainData.js',
        './src/main/generic/consensus/base/blockchain/ChainDataStore.js',
        './src/main/generic/consensus/base/mempool/Mempool.js',
        './src/main/generic/consensus/full/FullChain.js',
        './src/main/generic/consensus/full/FullConsensusAgent.js',
        './src/main/generic/consensus/full/FullConsensus.js',
        './src/main/generic/consensus/nano/NanoChain.js',
        './src/main/generic/consensus/nano/NanoConsensusAgent.js',
        './src/main/generic/consensus/nano/NanoConsensus.js',
        './src/main/generic/consensus/ConsensusDB.js',
        './src/main/generic/consensus/Consensus.js',
        './src/main/generic/network/Protocol.js',
        './src/main/generic/network/address/NetAddress.js',
        './src/main/generic/network/address/PeerAddress.js',
        './src/main/generic/network/address/PeerAddresses.js',
        './src/main/generic/network/message/Message.js',
        './src/main/generic/network/message/AddrMessage.js',
        './src/main/generic/network/message/BlockMessage.js',
        './src/main/generic/network/message/GetAddrMessage.js',
        './src/main/generic/network/message/GetBlocksMessage.js',
        './src/main/generic/network/message/HeaderMessage.js',
        './src/main/generic/network/message/InventoryMessage.js',
        './src/main/generic/network/message/MempoolMessage.js',
        './src/main/generic/network/message/Message.js',
        './src/main/generic/network/message/PingMessage.js',
        './src/main/generic/network/message/PongMessage.js',
        './src/main/generic/network/message/RejectMessage.js',
        './src/main/generic/network/message/SignalMessage.js',
        './src/main/generic/network/message/TxMessage.js',
        './src/main/generic/network/message/VersionMessage.js',
        './src/main/generic/network/message/AccountsProofMessage.js',
        './src/main/generic/network/message/GetAccountsProofMessage.js',
        './src/main/generic/network/message/ChainProofMessage.js',
        './src/main/generic/network/message/GetChainProofMessage.js',
        './src/main/generic/network/message/MessageFactory.js',
        './src/main/generic/network/NetworkAgent.js',
        './src/main/generic/network/Network.js',
        './src/main/generic/network/NetUtils.js',
        './src/main/generic/network/PeerChannel.js',
        './src/main/generic/network/PeerConnection.js',
        './src/main/generic/network/Peer.js',
        './src/main/generic/miner/Miner.js',
        './src/main/generic/wallet/WalletStore.js',
        './src/main/generic/wallet/Wallet.js',
        './src/main/generic/Core.js'
    ],
    test: [
        'src/test/specs/**/*.spec.js'
    ],
    sectest: [
        'sectests/**/*.sectest.js'
    ],
    all: [
        './src/main/**/*.js',
        './src/test/**/*.js',
        '!./src/**/node_modules/**/*.js'
    ]
};

const dependencies = ['./node_modules/jungle-db/dist/web.js']; // external dependencies

const babel_config = {
    plugins: ['transform-runtime', 'transform-es2015-modules-commonjs'],
    presets: ['es2016', 'es2017']
};

const babel_loader = {
    plugins: [['transform-runtime', {
        'polyfill': false
    }]],
    presets: ['env']
};

gulp.task('build-web-babel', function () {
    return merge(
        browserify([], {
            require: [
                'babel-runtime/core-js/array/from',
                'babel-runtime/core-js/object/values',
                'babel-runtime/core-js/object/freeze',
                'babel-runtime/core-js/object/keys',
                'babel-runtime/core-js/json/stringify',
                'babel-runtime/core-js/number/is-integer',
                'babel-runtime/core-js/number/max-safe-integer',
                'babel-runtime/core-js/math/clz32',
                'babel-runtime/core-js/math/fround',
                'babel-runtime/core-js/math/imul',
                'babel-runtime/core-js/math/trunc',
                'babel-runtime/core-js/promise',
                'babel-runtime/core-js/get-iterator',
                'babel-runtime/regenerator',
                'babel-runtime/helpers/asyncToGenerator',
                'fast-sha256',
                'elliptic'
            ]
        }).bundle()
            .pipe(source('babel.js'))
            .pipe(buffer())
            .pipe(uglify()),
        gulp.src(dependencies // external dependencies
            .concat(['./src/loader/prefix.js.template']).concat(sources.platform.browser).concat(sources.generic).concat(['./src/loader/suffix.js.template']), { base: '.' })
            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(concat('web.js'))
            .pipe(babel(babel_config)))
        .pipe(sourcemaps.init())
        .pipe(concat('web-babel.js'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist'));
});

gulp.task('build-web-crypto', function () {
    return merge(
        browserify([], {
            require: [
                'fast-sha256',
                'elliptic'
            ]
        }).bundle()
            .pipe(source('crypto.js'))
            .pipe(buffer())
            .pipe(uglify()),
        gulp.src(dependencies // external dependencies
            .concat(['./src/loader/prefix.js.template']).concat(sources.platform.browser).concat(sources.generic).concat(['./src/loader/suffix.js.template']), { base: '.' })
            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(concat('web.js')))
        .pipe(sourcemaps.init())
        .pipe(concat('web-crypto.js'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist'));
});

gulp.task('build-web', function () {
    return gulp.src(dependencies // external dependencies
        .concat(['./src/loader/prefix.js.template']).concat(sources.platform.browser).concat(sources.generic).concat(['./src/loader/suffix.js.template']), { base: '.' })
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(concat('web.js'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist'))
        .pipe(connect.reload());
});

gulp.task('build-loader', function () {
    return merge(
        browserify([], {
            require: [
                'babel-runtime/regenerator',
                'babel-runtime/helpers/asyncToGenerator',
                'babel-runtime/helpers/classCallCheck',
                'babel-runtime/helpers/createClass'
            ]
        }).bundle()
            .pipe(source('babel-runtime.js'))
            .pipe(buffer())
            .pipe(sourcemaps.init())
            .pipe(uglify()),
        gulp.src(['./src/main/platform/browser/utils/WindowDetector.js', './src/main/platform/browser/Nimiq.js'])
            .pipe(sourcemaps.init())
            .pipe(babel(babel_loader)))
        .pipe(concat('nimiq.js'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist'));
});

gulp.task('build-node', function () {
    return gulp.src(['./src/main/platform/nodejs/index.prefix.js'].concat(sources.platform.node).concat(sources.generic).concat(['./src/main/platform/nodejs/index.suffix.js']))
        .pipe(sourcemaps.init())
        .pipe(concat('node.js'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist'));
});

gulp.task('test', ['watch'], function () {
    gulp.run(jasmine({
        files: ['dist/web.js'].concat(sources.test)
    }));
});

gulp.task('test-babel', ['watch'], function () {
    gulp.run(jasmine({
        files: ['dist/web-babel.js'].concat(sources.test)
    }));
});

gulp.task('sectest', ['watch'], function () {
    gulp.run(jasmine({
        files: ['dist/web.js'].concat(sources.sectest)
    }));
});

gulp.task('sectest-babel', ['watch'], function () {
    gulp.run(jasmine({
        files: ['dist/web-babel.js'].concat(sources.sectest)
    }));
});

gulp.task('eslint', function () {
    const eslint = require('gulp-eslint');
    return gulp.src(sources.all)
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('watch', ['build-web'], function () {
    return gulp.watch(sources.all, ['build-web']);
});

gulp.task('serve', ['watch'], function () {
    connect.server({
        livereload: true,
        serverInit: function () {
            util.log(util.colors.blue('Nimiq Blockchain Cockpit will be at http://localhost:8080/clients/browser/'));
        }
    });
});

gulp.task('build', ['build-web', 'build-web-crypto', 'build-web-babel', 'build-loader', 'build-node']);

gulp.task('default', ['build', 'serve']);
