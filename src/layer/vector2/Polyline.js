
L.Polyline = L.Path.extend({

	options: {
		// how much to simplify the polyline on each zoom level
		// more = better performance and smoother look, less = more accurate
		smoothFactor: 1.0
		// noClip: false
	},

	initialize: function (latlngs, options) {
		L.setOptions(this, options);
		this._latlngs = this._convertLatLngs(latlngs);
	},

	getLatLngs: function () {
		return this._latlngs;
	},

	setLatLngs: function (latlngs) {
		this._latlngs = this._convertLatLngs(latlngs);
		return this.redraw();
	},

	addLatLng: function (latlng) {
		this._latlngs.push(L.latLng(latlng));
		return this.redraw();
	},

	spliceLatLngs: function () {
		var removed = [].splice.apply(this._latlngs, arguments);
		this._latlngs = this._convertLatLngs(this._latlngs);
		this.redraw();
		return removed;
	},

	// TODO closestLayerPoint?

	getBounds: function () {
		return new L.LatLngBounds(this.getLatLngs());
	},

	_convertLatLngs: function (latlngs) {
		var result = [];

		for (var i = 0, len = latlngs.length; i < len; i++) {
			result[i] = L.latLng(latlngs[i]);
		}
		return result;
	},

	_project: function () {
		this._originalPoints = this._projectLatlngs(this._latlngs);
	},

	_projectLatlngs: function (latlngs) {
		var result = [],
		    flat = latlngs[0] instanceof L.LatLng;

		for (var i = 0, len = latlngs.length; i < len; i++) {
			result[i] = flat ?
					this._map.latLngToLayerPoint(latlngs[i]) :
					this._projectLatlngs(latlngs[i]);
		}
		return result;
	},

	_clipPoints: function () {
		var points = this._originalPoints;

		if (this.options.noClip) {
			this._parts = [points];
			return;
		}

		this._parts = [];

		var parts = this._parts,
		    bounds = this._renderer._bounds,
		    len = points.length,
		    i, k, segment;

		for (i = 0, k = 0; i < len - 1; i++) {
			segment = L.LineUtil.clipSegment(points[i], points[i + 1], bounds, i);

			if (!segment) { continue; }

			parts[k] = parts[k] || [];
			parts[k].push(segment[0]);

			// if segment goes out of screen, or it's the last one, it's the end of the line part
			if ((segment[1] !== points[i + 1]) || (i === len - 2)) {
				parts[k].push(segment[1]);
				k++;
			}
		}
	},

	// simplify each clipped part of the polyline
	_simplifyPoints: function () {
		var parts = this._parts,
			tolerance = this.options.smoothFactor;

		for (var i = 0, len = parts.length; i < len; i++) {
			parts[i] = L.LineUtil.simplify(parts[i], tolerance);
		}
	}
});

L.polyline = function (latlngs, options) {
	return new L.Polyline(latlngs, options);
};